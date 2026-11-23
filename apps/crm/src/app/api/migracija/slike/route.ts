import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { eq, ilike, sql as drizzleSql } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { readLegacyUpload } from "@/lib/legacy-media";

export const dynamic = "force-dynamic";
// Safe on every Vercel plan (Hobby caps at 60s). The route is resumable, so
// just call it repeatedly until `remaining` reaches 0.
export const maxDuration = 60;

/**
 * One-time (resumable) migration of product images OFF the old WordPress /
 * Hostinger host and INTO Vercel Blob, so the storefront no longer depends on
 * palladio.hr being up.
 *
 * Runs ON Vercel (has outbound network to palladio.hr + the Postgres DB +
 * BLOB_READ_WRITE_TOKEN). It CANNOT be run from a sandboxed dev box that has no
 * route to palladio.hr.
 *
 * How it works, per call:
 *   1. Pull up to `batch` products whose images JSON still contains a
 *      palladio.hr URL (so finished products are skipped — idempotent/resumable).
 *   2. Download each such image, upload it to Blob at its original WP path
 *      (wp-content/uploads/...), and swap the URL in the product's images JSON.
 *   3. Report how many products still remain so the caller knows to call again.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>   (same secret as the cron routes).
 *
 * Query params:
 *   batch=<n>        products per call (default 20)
 *   dryRun=1         report what WOULD migrate, upload nothing, write nothing
 *   includeStatics=1 also migrate the hard-coded hero images from the web app
 *                    and return their old->new mapping (used once, to patch the
 *                    frontend source).
 */

// Hard-coded hero/render images referenced directly in apps/web source.
const STATIC_URLS = [
  "https://palladio.hr/wp-content/uploads/2026/10/render0.jpg",
  "https://palladio.hr/wp-content/uploads/2026/10/render-1.jpg",
];

const OLD_HOST_RE = /palladio\.hr/i;

function keyFromUrl(rawUrl: string): string {
  // Mirror the WP path so blob keys stay human-readable and stable.
  const path = new URL(rawUrl).pathname.replace(/^\/+/, "");
  return path || `misc/${encodeURIComponent(rawUrl)}`;
}

function contentTypeFor(url: string, headerValue: string | null): string {
  if (headerValue && headerValue.startsWith("image/")) return headerValue;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}

// Download one WP image directly from the legacy host. Returns the new public
// Blob URL. Memoised across a single invocation via `cache`.
async function migrateOne(
  rawUrl: string,
  cache: Map<string, string>,
  dryRun: boolean
): Promise<string> {
  const cached = cache.get(rawUrl);
  if (cached) return cached;

  if (dryRun) {
    cache.set(rawUrl, rawUrl);
    return rawUrl;
  }

  try {
    const uploadPath = new URL(rawUrl).pathname.replace(/^\/wp-content\/uploads\//, "");
    const source = await readLegacyUpload(uploadPath);
    if (source.status < 200 || source.status >= 300) throw new Error(`HTTP ${source.status}`);
    const { url } = await put(keyFromUrl(rawUrl), source.body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentTypeFor(rawUrl, source.contentType),
    });
    cache.set(rawUrl, url);
    return url;
  } catch (e) {
    throw new Error(`${rawUrl}: ${e instanceof Error ? e.message : "fetch/upload failed"}`);
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const batch = Math.min(Math.max(parseInt(searchParams.get("batch") || "20", 10), 1), 100);
  const dryRun = searchParams.get("dryRun") === "1";
  const includeStatics = searchParams.get("includeStatics") === "1";

  const cache = new Map<string, string>();
  const errors: string[] = [];
  let productsTouched = 0;
  let imagesUploaded = 0;

  // --- product images ---
  const rows = await db
    .select({ id: products.id, images: products.images })
    .from(products)
    .where(ilike(products.images, "%palladio.hr%"))
    .orderBy(products.id)
    .limit(batch);

  for (const row of rows) {
    let arr: string[];
    try {
      arr = row.images ? (JSON.parse(row.images) as string[]) : [];
    } catch {
      errors.push(`product ${row.id}: invalid images JSON`);
      continue;
    }

    let changed = false;
    const next: string[] = [];
    for (const src of arr) {
      if (typeof src === "string" && OLD_HOST_RE.test(src)) {
        try {
          const newUrl = await migrateOne(src, cache, dryRun);
          if (newUrl !== src) {
            imagesUploaded++;
            changed = true;
          }
          next.push(newUrl);
        } catch (e) {
          errors.push(e instanceof Error ? e.message : `product ${row.id}: image failed`);
          next.push(src); // keep original so nothing is lost
        }
      } else {
        next.push(src);
      }
    }

    if (changed && !dryRun) {
      await db.update(products).set({ images: JSON.stringify(next) }).where(eq(products.id, row.id));
      productsTouched++;
    } else if (changed && dryRun) {
      productsTouched++;
    }
  }

  // --- optional: hard-coded hero images from the web app ---
  const staticMappings: Record<string, string> = {};
  if (includeStatics) {
    for (const u of STATIC_URLS) {
      try {
        staticMappings[u] = await migrateOne(u, cache, dryRun);
        if (!dryRun) imagesUploaded++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : `static ${u} failed`);
      }
    }
  }

  // --- how much is left ---
  const [{ c }] = await db
    .select({ c: drizzleSql<number>`count(*)::int` })
    .from(products)
    .where(ilike(products.images, "%palladio.hr%"));

  return NextResponse.json({
    ok: true,
    dryRun,
    batch,
    productsTouched,
    imagesUploaded,
    remaining: c,
    done: c === 0,
    ...(includeStatics ? { staticMappings } : {}),
    errors,
  });
}

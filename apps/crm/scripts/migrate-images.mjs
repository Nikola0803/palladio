// Migrate all product + landing images OFF palladio.hr INTO Vercel Blob.
//
// Run this from YOUR machine (it needs network to palladio.hr, which the
// Vercel/sandbox does not reliably have). It does NOT need the CRM to be
// deployed, so it sidesteps the current build failure entirely.
//
// What it does:
//   1. Reads products.images straight from the DB — the exact URLs the
//      storefront renders — and collects every palladio.hr image URL, plus the
//      two hard-coded landing hero renders.
//   2. Downloads each (trying the www. variant as a fallback) and uploads it to
//      Vercel Blob at its original wp-content/uploads/... path.
//   3. Rewrites products.images in the DB to the new Blob URLs.
//   4. Writes scripts/image-url-map.json (old -> new) and prints the hero
//      mapping, so the 2 landing URLs in apps/web can be patched.
//
// It is idempotent/resumable: already-migrated rows no longer contain
// palladio.hr, so re-running only picks up leftovers.
//
// Requirements (env vars):
//   POSTGRES_URL            your Neon/Vercel Postgres connection string
//   BLOB_READ_WRITE_TOKEN   from Vercel -> Storage -> your Blob store -> Tokens
//
// Usage (from apps/crm, so the deps resolve):
//   cd apps/crm && npm install
//   POSTGRES_URL='postgres://...' BLOB_READ_WRITE_TOKEN='vercel_blob_rw_...' \
//     node scripts/migrate-images.mjs
//   # add  --dry  to preview without downloading, uploading or writing.

import { writeFileSync } from "node:fs";
import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";

const DRY = process.argv.includes("--dry");
const CONCURRENCY = 6;

const STATIC_HERO_URLS = [
  "https://palladio.hr/wp-content/uploads/2026/10/render0.jpg",
  "https://palladio.hr/wp-content/uploads/2026/10/render-1.jpg",
];

const OLD_HOST_RE = /palladio\.hr/i;

function keyFromUrl(rawUrl) {
  const path = new URL(rawUrl).pathname.replace(/^\/+/, "");
  return path || `misc/${Date.now()}`;
}

function contentTypeFor(url, header) {
  if (header && header.startsWith("image/")) return header;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
      avif: "image/avif",
    }[ext] || "application/octet-stream"
  );
}

async function migrateOne(rawUrl) {
  const candidates = [
    rawUrl,
    rawUrl.replace(/^(https?:\/\/)palladio\.hr/i, "$1www.palladio.hr"),
  ];
  let lastErr = "";
  for (const candidate of candidates) {
    try {
      const resp = await fetch(candidate, { cache: "no-store" });
      if (!resp.ok) {
        lastErr = `HTTP ${resp.status}`;
        continue;
      }
      const buf = Buffer.from(await resp.arrayBuffer());
      const { url } = await put(keyFromUrl(rawUrl), buf, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: contentTypeFor(rawUrl, resp.headers.get("content-type")),
      });
      return url;
    } catch (e) {
      lastErr = e?.message || "fetch/upload failed";
    }
  }
  throw new Error(`${rawUrl}: ${lastErr}`);
}

async function runPool(items, worker) {
  const results = new Map();
  let i = 0;
  async function next() {
    while (i < items.length) {
      const item = items[i++];
      try {
        results.set(item, { ok: true, value: await worker(item) });
      } catch (e) {
        results.set(item, { ok: false, error: e.message });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, next));
  return results;
}

async function main() {
  if (!process.env.POSTGRES_URL)
    throw new Error("POSTGRES_URL is not set");
  if (!DRY && !process.env.BLOB_READ_WRITE_TOKEN)
    throw new Error("BLOB_READ_WRITE_TOKEN is not set (or pass --dry)");

  const { rows } = await sql`
    SELECT id, images FROM products WHERE images LIKE '%palladio.hr%' ORDER BY id`;

  // Collect every unique palladio.hr URL across all product rows + heroes.
  const urlSet = new Set(STATIC_HERO_URLS);
  const parsed = [];
  for (const r of rows) {
    let arr = [];
    try {
      arr = r.images ? JSON.parse(r.images) : [];
    } catch {
      console.warn(`! product ${r.id}: invalid images JSON — skipped`);
      continue;
    }
    parsed.push({ id: r.id, arr });
    for (const src of arr) if (typeof src === "string" && OLD_HOST_RE.test(src)) urlSet.add(src);
  }

  const urls = [...urlSet];
  console.log(`${rows.length} products with old images; ${urls.length} unique image URLs to migrate.`);
  if (DRY) {
    console.log("DRY RUN — nothing downloaded/uploaded/written.");
    urls.slice(0, 20).forEach((u) => console.log("  would migrate:", u));
    if (urls.length > 20) console.log(`  ...and ${urls.length - 20} more`);
    return;
  }

  // 1) Upload every unique image once.
  const res = await runPool(urls, migrateOne);
  const map = {};
  let uploaded = 0;
  const errors = [];
  for (const u of urls) {
    const r = res.get(u);
    if (r?.ok) {
      map[u] = r.value;
      uploaded++;
    } else {
      errors.push(`${u} -> ${r?.error || "unknown"}`);
    }
  }
  console.log(`Uploaded ${uploaded}/${urls.length} images to Blob.`);

  // 2) Rewrite each product's images JSON by URL replacement.
  let touched = 0;
  for (const p of parsed) {
    let changed = false;
    const next = p.arr.map((src) => {
      if (typeof src === "string" && map[src]) {
        changed = true;
        return map[src];
      }
      return src;
    });
    if (changed) {
      await sql`UPDATE products SET images = ${JSON.stringify(next)} WHERE id = ${p.id}`;
      touched++;
    }
  }
  console.log(`Rewrote images for ${touched} products.`);

  // 3) Persist the full map + show the hero mapping for the frontend patch.
  writeFileSync(
    new URL("./image-url-map.json", import.meta.url),
    JSON.stringify(map, null, 2)
  );
  console.log("\nLanding hero mapping (patch these in apps/web/src/pages/HomePage.tsx):");
  for (const h of STATIC_HERO_URLS) console.log(`  ${h}\n    -> ${map[h] || "FAILED"}`);

  if (errors.length) {
    console.log(`\n${errors.length} image(s) failed:`);
    errors.forEach((e) => console.log("  " + e));
  }
  console.log("\nWrote scripts/image-url-map.json");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
  }
);

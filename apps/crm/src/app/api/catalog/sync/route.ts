import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getSvePostavke } from "@/lib/settings";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Auth: either CRM session cookie or Bearer CRON_SECRET
async function isAuthorised(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  const token = req.cookies.get("crm_session")?.value;
  const secret = process.env.AUTH_SECRET ? new TextEncoder().encode(process.env.AUTH_SECRET) : null;
  if (token && secret) {
    try {
      await jwtVerify(token, secret);
      return true;
    } catch {}
  }
  return false;
}

type WooCategory = { id: number; name: string; slug: string };
type WooImage = { id: number; src: string; alt: string };
type WooAttribute = { id: number; name: string; options: string[]; variation: boolean };
type WooMeta = { key: string; value: unknown };

type WooProduct = {
  id: number;
  type: string;
  sku: string;
  name: string;
  slug: string;
  status: string;
  short_description: string;
  description: string;
  regular_price: string;
  sale_price: string;
  categories: WooCategory[];
  tags: { name: string }[];
  images: WooImage[];
  parent_id: number;
  attributes: WooAttribute[];
  meta_data: WooMeta[];
  menu_order: number;
};

function getMetaValue(meta: WooMeta[], key: string): string {
  const item = meta.find((m) => m.key === key);
  return typeof item?.value === "string" ? item.value : "";
}

function mapWooProduct(p: WooProduct) {
  return {
    id: p.id,
    type: p.type || "simple",
    sku: p.sku || null,
    name: p.name,
    slug: p.slug || null,
    published: p.status === "publish",
    shortDescription: p.short_description || null,
    description: p.description || null,
    regularPrice: p.regular_price ? parseFloat(p.regular_price) : null,
    salePrice: p.sale_price ? parseFloat(p.sale_price) : null,
    categories: (p.categories || []).map((c) => c.name).join(", ") || null,
    tags: (p.tags || []).map((t) => t.name).join(", ") || null,
    images: JSON.stringify((p.images || []).map((i) => i.src)),
    parentId: p.parent_id || null,
    attributes: p.attributes?.length ? p.attributes : null,
    metalPurity: getMetaValue(p.meta_data || [], "_metal_purity") || null,
    totalWeight: getMetaValue(p.meta_data || [], "_total_weight") || null,
    position: p.menu_order || 0,
  };
}

async function fetchWooPage(
  siteUrl: string,
  consumerKey: string,
  consumerSecret: string,
  page: number,
  perPage: number
): Promise<{ items: WooProduct[]; totalPages: number }> {
  const url = new URL(`${siteUrl.replace(/\/$/, "")}/wp-json/wc/v3/products`);
  url.searchParams.set("consumer_key", consumerKey);
  url.searchParams.set("consumer_secret", consumerSecret);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("status", "publish");
  // include variations so parent→child relationship works
  url.searchParams.set("type", "simple,variable,variation");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WooCommerce API ${res.status}: ${body.slice(0, 300)}`);
  }

  const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
  const items: WooProduct[] = await res.json();
  return { items, totalPages };
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorised(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
  }

  const p = await getSvePostavke();
  const siteUrl = p.WC_SITE_URL || p.WP_SITE_URL;

  if (!siteUrl || !p.WOOCOMMERCE_CONSUMER_KEY || !p.WOOCOMMERCE_CONSUMER_SECRET) {
    return NextResponse.json(
      { error: "Missing WooCommerce credentials in CRM settings (WC_SITE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET)" },
      { status: 400, headers: CORS }
    );
  }

  const { searchParams } = new URL(req.url);
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "50", 10), 100);
  // pageLimit: how many pages to fetch in one call (default all, but cap at 20
  // to stay inside the 60s limit on Vercel Hobby — call repeatedly for large catalogs)
  const pageLimit = parseInt(searchParams.get("page_limit") || "20", 10);

  const errors: string[] = [];
  let upserted = 0;
  let page = 1;
  let totalPages = 1;
  let pagesProcessed = 0;

  do {
    let items: WooProduct[];
    try {
      const result = await fetchWooPage(
        siteUrl,
        p.WOOCOMMERCE_CONSUMER_KEY,
        p.WOOCOMMERCE_CONSUMER_SECRET,
        page,
        perPage
      );
      items = result.items;
      totalPages = result.totalPages;
    } catch (e) {
      errors.push(`Page ${page}: ${e instanceof Error ? e.message : "fetch failed"}`);
      break;
    }

    for (const wooProduct of items) {
      try {
        const row = mapWooProduct(wooProduct);
        await db
          .insert(products)
          .values(row)
          .onConflictDoUpdate({
            target: products.id,
            set: {
              type: row.type,
              sku: row.sku,
              name: row.name,
              slug: row.slug,
              published: row.published,
              shortDescription: row.shortDescription,
              description: row.description,
              regularPrice: row.regularPrice,
              salePrice: row.salePrice,
              categories: row.categories,
              tags: row.tags,
              images: row.images,
              parentId: row.parentId,
              attributes: row.attributes,
              metalPurity: row.metalPurity,
              totalWeight: row.totalWeight,
              position: row.position,
            },
          });
        upserted++;
      } catch (e) {
        errors.push(`Product ${wooProduct.id} (${wooProduct.name}): ${e instanceof Error ? e.message : "upsert failed"}`);
      }
    }

    pagesProcessed++;
    page++;
  } while (page <= totalPages && pagesProcessed < pageLimit);

  const hasMore = page <= totalPages;

  return NextResponse.json(
    {
      ok: true,
      upserted,
      pagesProcessed,
      totalPages,
      hasMore,
      nextPage: hasMore ? page : null,
      errors,
    },
    { headers: CORS }
  );
}

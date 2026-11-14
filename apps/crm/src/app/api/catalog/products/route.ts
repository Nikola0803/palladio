import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, ilike, or, and, isNull, sql as drizzleSql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function normalizeImgSrc(src: string): string {
  // Rewrite WordPress media URLs: palladio.hr → www.palladio.hr
  // so the Vercel proxy rewrite in apps/web/vercel.json can proxy them to Hostinger.
  return src.replace(
    /^https?:\/\/palladio\.hr(\/wp-content\/uploads\/)/,
    "https://www.palladio.hr$1"
  );
}

function mapProduct(r: typeof products.$inferSelect & { images?: string | null }) {
  let images: { id: number; src: string; alt: string }[] = [];
  try {
    const raw: string[] = r.images ? JSON.parse(r.images) : [];
    images = raw.map((src, i) => ({ id: i, src: normalizeImgSrc(src), alt: r.name }));
  } catch {}

  const catParts = (r.categories || "").split(",").map((c) => c.trim()).filter(Boolean);
  const categories = catParts.map((name, i) => ({
    id: i,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
  }));

  const price = (r.salePrice || r.regularPrice || 0).toFixed(2);

  return {
    id: r.id,
    name: r.name,
    slug: r.slug || "",
    permalink: "",
    sku: r.sku || "",
    price,
    regular_price: (r.regularPrice || 0).toFixed(2),
    sale_price: r.salePrice ? r.salePrice.toFixed(2) : "",
    on_sale: !!(r.salePrice && r.salePrice < (r.regularPrice || Infinity)),
    stock_status: "instock" as const,
    short_description: r.shortDescription || "",
    description: r.description || "",
    type: r.type || "simple",
    attributes: [],
    images,
    categories,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("search") || searchParams.get("q");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "24"), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const offset = (page - 1) * perPage;
  const random = searchParams.get("random") === "1";

  const conditions = [
    isNull(products.parentId),
    eq(products.published, true),
  ];

  if (category) {
    conditions.push(ilike(products.categories, `%${category}%`));
  }
  if (q) {
    conditions.push(
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.categories, `%${q}%`),
        ilike(products.description, `%${q}%`)
      )!
    );
  }

  const where = and(...conditions);

  const [countResult, rows] = await Promise.all([
    db.select({ count: drizzleSql<number>`count(*)::int` }).from(products).where(where),
    db.select().from(products).where(where)
      .limit(perPage).offset(offset)
      .orderBy(products.position, products.id),
  ]);

  const total = countResult[0]?.count ?? 0;
  const items = rows.map(mapProduct);

  if (random) items.sort(() => Math.random() - 0.5);

  return NextResponse.json(
    { items, total, page, per_page: perPage },
    { headers: CORS }
  );
}

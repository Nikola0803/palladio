import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

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
  return src.replace(
    /^https?:\/\/palladio\.hr(\/wp-content\/uploads\/)/,
    "https://www.palladio.hr$1"
  );
}

function mapProduct(r: typeof products.$inferSelect) {
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

  return {
    id: r.id,
    name: r.name,
    slug: r.slug || "",
    permalink: "",
    sku: r.sku || "",
    price: (r.salePrice || r.regularPrice || 0).toFixed(2),
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

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const idNum = parseInt(slug);

  const [row] = await db
    .select()
    .from(products)
    .where(
      isNaN(idNum)
        ? eq(products.slug, slug)
        : or(eq(products.slug, slug), eq(products.id, idNum))!
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS });
  }

  return NextResponse.json(mapProduct(row), { headers: CORS });
}

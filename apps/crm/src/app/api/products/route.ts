import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, ilike, or, and, isNull, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const type = searchParams.get("type") || "variable,simple"; // default: no variations
  const withVariations = searchParams.get("withVariations") === "1";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const offset = (page - 1) * limit;

  const conditions = [];

  // By default exclude variations unless explicitly requested
  if (!withVariations) {
    conditions.push(isNull(products.parentId));
  }

  if (category) {
    conditions.push(ilike(products.categories, `%${category}%`));
  }

  if (q) {
    conditions.push(
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.categories, `%${q}%`),
        ilike(products.description, `%${q}%`)
      )
    );
  }

  if (type && type !== "all") {
    const types = type.split(",").map(t => t.trim());
    if (types.length === 1) {
      conditions.push(eq(products.type, types[0]));
    }
  }

  conditions.push(eq(products.published, true));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: products.id,
      type: products.type,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      regularPrice: products.regularPrice,
      salePrice: products.salePrice,
      categories: products.categories,
      images: products.images,
      shortDescription: products.shortDescription,
      attributes: products.attributes,
      metalPurity: products.metalPurity,
      parentId: products.parentId,
    })
    .from(products)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(products.position, products.id);

  // Parse images JSON for each row
  const result = rows.map(r => ({
    ...r,
    images: r.images ? JSON.parse(r.images) : [],
  }));

  return NextResponse.json({ products: result, page, limit }, { headers: CORS });
}

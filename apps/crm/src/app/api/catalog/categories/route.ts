import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, isNull, sql as drizzleSql } from "drizzle-orm";

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
  const parentOnly = searchParams.get("parent_only") === "1";

  // Pull all published parent products to extract unique categories
  const rows = await db
    .select({ categories: products.categories })
    .from(products)
    .where(eq(products.published, true));

  // Count products per category
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.categories) continue;
    for (const cat of row.categories.split(",")) {
      const name = cat.trim();
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }
  }

  const categories = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({
      id: i + 1,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: "",
      count,
      image: null,
      parent: 0,
    }));

  return NextResponse.json(categories, { headers: CORS });
}

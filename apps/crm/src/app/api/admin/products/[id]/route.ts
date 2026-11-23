import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function optionalText(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function optionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function parseImages(value: unknown) {
  if (!Array.isArray(value)) return null;
  return value.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Neispravan proizvod" }, { status: 400 });
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Neispravan proizvod" }, { status: 400 });

  const body = await req.json();
  const name = optionalText(body.name);
  if (!name) return NextResponse.json({ error: "Naziv proizvoda je obavezan" }, { status: 400 });
  const images = parseImages(body.images);
  if (!images) return NextResponse.json({ error: "Slike moraju biti lista URL-ova" }, { status: 400 });

  const [updated] = await db.update(products).set({
    name,
    slug: optionalText(body.slug),
    sku: optionalText(body.sku),
    shortDescription: optionalText(body.shortDescription),
    description: optionalText(body.description),
    categories: optionalText(body.categories),
    regularPrice: optionalNumber(body.regularPrice),
    salePrice: optionalNumber(body.salePrice),
    metalPurity: optionalText(body.metalPurity),
    totalWeight: optionalText(body.totalWeight),
    published: body.published === true,
    images: JSON.stringify(images),
  }).where(eq(products.id, id)).returning();

  if (!updated) return NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 });
  return NextResponse.json(updated);
}

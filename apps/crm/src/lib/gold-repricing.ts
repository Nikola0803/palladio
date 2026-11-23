import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

type GoldPrice = { cijenaEurPoGramu585: number; cijenaEurPoGramu750: number; cijenaEurPoGramu925: number };

function gramPrice(purity: string | null, price: GoldPrice) {
  if (purity === "585") return price.cijenaEurPoGramu585;
  if (purity === "750") return price.cijenaEurPoGramu750;
  if (purity === "925") return price.cijenaEurPoGramu925;
  return null;
}

// Only explicitly configured products are repriced. Existing catalog prices
// remain the fallback until a single purity and a weight are saved in CRM.
export async function repriceConfiguredCatalog(price: GoldPrice) {
  const rows = await db.select().from(products).where(and(eq(products.published, true), isNull(products.parentId)));
  const changed: Array<{ id: number; price: number }> = [];
  for (const product of rows) {
    const grams = Number(product.totalWeight);
    const perGram = gramPrice(product.metalPurity, price);
    if (!perGram || !Number.isFinite(grams) || grams <= 0) continue;
    const nextPrice = Math.round(grams * perGram * 100) / 100;
    if (product.regularPrice === nextPrice && product.salePrice === null) continue;
    await db.update(products).set({ regularPrice: nextPrice, salePrice: null }).where(eq(products.id, product.id));
    changed.push({ id: product.id, price: nextPrice });
  }
  return changed;
}

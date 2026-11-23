import { db } from "@/lib/db";
import { cijenaZlataPovijest, products } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductEditor from "@/components/ProductEditor";

export const revalidate = 0;

export default async function UrediProizvodPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const [[product], [goldPrice]] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).limit(1),
    db.select().from(cijenaZlataPovijest).orderBy(desc(cijenaZlataPovijest.vrijeme)).limit(1),
  ]);
  if (!product) notFound();
  return <ProductEditor product={product} goldPrice={goldPrice || null} />;
}

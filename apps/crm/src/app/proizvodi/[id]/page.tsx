import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductEditor from "@/components/ProductEditor";

export const revalidate = 0;

export default async function UrediProizvodPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();
  return <ProductEditor product={product} />;
}

import { db } from "@/lib/db";
import { paymentLinks, products } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import PaymentLinksClient from "@/components/PaymentLinksClient";

export const revalidate = 0;

export default async function PaymentLinksPage() {
  const [rows, katalog] = await Promise.all([db
    .select()
    .from(paymentLinks)
    .orderBy(desc(paymentLinks.id)), db.select({ id: products.id, name: products.name, regularPrice: products.regularPrice, salePrice: products.salePrice }).from(products).orderBy(products.name).limit(250)]);

  const linkovi = rows.map(({ kreirano, azurirano, placenoAt, ...rest }) => ({
    ...rest,
    kreirano: kreirano?.toISOString() ?? null,
    placenoAt: placenoAt?.toISOString() ?? null,
  }));

  return <PaymentLinksClient pocetniLinkovi={linkovi} katalog={katalog} />;
}

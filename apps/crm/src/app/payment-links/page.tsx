import { db } from "@/lib/db";
import { paymentLinks } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import PaymentLinksClient from "@/components/PaymentLinksClient";

export const revalidate = 0;

export default async function PaymentLinksPage() {
  const rows = await db
    .select()
    .from(paymentLinks)
    .orderBy(desc(paymentLinks.id));

  const linkovi = rows.map(({ kreirano, azurirano, placenoAt, ...rest }) => ({
    ...rest,
    kreirano: kreirano?.toISOString() ?? null,
    placenoAt: placenoAt?.toISOString() ?? null,
  }));

  return <PaymentLinksClient pocetniLinkovi={linkovi} />;
}

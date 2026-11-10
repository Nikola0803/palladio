import { db } from "@/lib/db";
import { paymentLinks } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import PaymentLinksClient from "@/components/PaymentLinksClient";

export const revalidate = 0;

export default async function PaymentLinksPage() {
  const linkovi = await db
    .select()
    .from(paymentLinks)
    .orderBy(desc(paymentLinks.id));

  return <PaymentLinksClient pocetniLinkovi={linkovi} />;
}

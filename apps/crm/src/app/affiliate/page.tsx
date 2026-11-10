import { db } from "@/lib/db";
import { affiliatePartneri } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import AffiliateClient from "@/components/AffiliateClient";

export const revalidate = 0;

export default async function AffiliatePage() {
  const partneri = await db
    .select()
    .from(affiliatePartneri)
    .orderBy(desc(affiliatePartneri.id));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ink-100">Affiliate</h1>
        <p className="text-ink-400 text-sm mt-1">
          Partneri, kodovi za praćenje i obračun provizije
        </p>
      </header>

      <AffiliateClient pocetniPartneri={partneri} />
    </div>
  );
}

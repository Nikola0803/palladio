import { db } from "@/lib/db";
import { kupci } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import NewsletterSync from "@/components/NewsletterSync";
import { Mail } from "lucide-react";

export const revalidate = 0;

export default async function NewsletterPage() {
  const [{ brojPretplacenika }] = await db
    .select({ brojPretplacenika: sql<number>`count(*)` })
    .from(kupci)
    .where(eq(kupci.prijavljenNaNewsletter, true));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ink-100">Newsletter</h1>
        <p className="text-ink-400 text-sm mt-1">
          Najave novih kolekcija — lista se povlači iz Kupaca, slanje ide preko Brevo
        </p>
      </header>

      <NewsletterSync brojPretplacenika={brojPretplacenika ?? 0} />

      <div className="mt-6 flex items-start gap-2 text-xs text-ink-400 bg-ink-800 border border-ink-700 rounded-md px-4 py-3 shadow-card">
        <Mail size={14} className="mt-0.5 shrink-0 text-gold" />
        <span>
          Kreiranje i slanje same kampanje (naslov, slike, sadržaj) radi se u
          Brevo-u nakon sinkronizacije liste — ovdje samo držimo listu ažurnom.
          Ako želiš da se kampanje kreiraju i odavde, javi i dodajemo Brevo
          Campaigns API poziv.
        </span>
      </div>
    </div>
  );
}

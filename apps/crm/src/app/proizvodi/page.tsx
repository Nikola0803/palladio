import { db } from "@/lib/db";
import { gotoviProizvodi, cijenaZlataPovijest } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import ProizvodiTable from "@/components/ProizvodiTable";
import { Info } from "lucide-react";

export const revalidate = 0;

export default async function ProizvodiPage() {
  const [proizvodi, [cijenaZlata]] = await Promise.all([
    db.select().from(gotoviProizvodi).orderBy(desc(gotoviProizvodi.id)).limit(50),
    db
      .select()
      .from(cijenaZlataPovijest)
      .orderBy(desc(cijenaZlataPovijest.vrijeme))
      .limit(1),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ink-100">Proizvodi</h1>
        <p className="text-ink-400 text-sm mt-1">
          Cijene na osnovu cijene zlata i težine — uređuj i pošalji u
          WooCommerce jednim klikom
        </p>
      </header>

      <div className="mb-6 flex items-start gap-2 text-xs text-ink-400 bg-ink-800 border border-ink-700 rounded-md px-4 py-3 shadow-card">
        <Info size={14} className="mt-0.5 shrink-0 text-gold" />
        <span>
          Predložena cijena = težina × cijena zlata po gramu za tu čistoću ×
          faktor marže (trenutno 2.4×). Prilagodi faktor u{" "}
          <code className="text-ink-100">ProizvodiTable.tsx</code> kad budeš
          znao stvarnu formulu (rad, kamenje, itd).
        </span>
      </div>

      <ProizvodiTable proizvodi={proizvodi} cijenaZlata={cijenaZlata ?? null} />
    </div>
  );
}

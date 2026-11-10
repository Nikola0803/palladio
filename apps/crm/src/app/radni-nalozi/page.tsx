import { db } from "@/lib/db";
import { radniNalozi } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import RadniNaloziClient from "@/components/RadniNaloziClient";

export const revalidate = 0;

export default async function RadniNaloziPage() {
  const nalozi = await db.select().from(radniNalozi).orderBy(desc(radniNalozi.id));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ink-100">Radni nalozi</h1>
        <p className="text-ink-400 text-sm mt-1">
          Od utroška sirovina do gotovog komada — zatvaranje naloga automatski
          stvara zapis u Proizvodima
        </p>
      </header>

      <RadniNaloziClient pocetniNalozi={nalozi} />
    </div>
  );
}

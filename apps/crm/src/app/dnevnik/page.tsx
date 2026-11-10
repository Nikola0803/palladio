import { db } from "@/lib/db";
import { dnevnikZapisi } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import DnevnikClient from "@/components/DnevnikClient";

export const revalidate = 0;

export default async function DnevnikPage() {
  const zapisi = await db
    .select()
    .from(dnevnikZapisi)
    .orderBy(desc(dnevnikZapisi.datum));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ink-100">Dnevnik</h1>
        <p className="text-ink-400 text-sm mt-1">
          Šta je rađeno svaki dan i kakvi su bili problemi — lako se vratiti
          na bilo koji dan
        </p>
      </header>

      <DnevnikClient pocetniZapisi={zapisi} />
    </div>
  );
}

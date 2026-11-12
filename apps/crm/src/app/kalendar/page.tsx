import { db } from "@/lib/db";
import { obaveze, dolazneFakture } from "@/lib/db/schema";
import CalendarGrid from "@/components/CalendarGrid";
import { desc } from "drizzle-orm";

export const revalidate = 0;

export default async function KalendarPage() {
  const [obavezeRows, fakture] = await Promise.all([
    db.select().from(obaveze),
    db.select().from(dolazneFakture),
  ]);

  // Merge manual obligations with invoice due dates into one event list.
  const dogadjaji = [
    ...obavezeRows.map((o) => ({
      datum: o.datum,
      naslov: o.naslov,
      tip: (o.tip ?? "ostalo") as "ostalo" | "faktura" | "radni_nalog",
      zavrseno: !!o.zavrseno,
    })),
    ...fakture
      .filter((f) => f.status !== "placeno")
      .map((f) => ({
        datum: f.rokPlacanja,
        naslov: `Rok plaćanja: ${f.dobavljac} (${f.brojFakture})`,
        tip: "faktura" as const,
        zavrseno: false,
      })),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink-100">Kalendar</h1>
        <p className="text-ink-400 text-sm mt-1">
          Obaveze i rokovi plaćanja faktura, na jednom mjestu
        </p>
      </header>

      <CalendarGrid dogadjaji={dogadjaji} />
    </div>
  );
}

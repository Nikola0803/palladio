import { db } from "@/lib/db";
import { upiti } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Inbox } from "lucide-react";

export const revalidate = 0;

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    novo: "border-gold/40 text-gold bg-gold-dim",
    u_obradi: "border-rose/40 text-rose bg-rose/10",
    zavrseno: "border-moss/40 text-moss bg-moss/10",
  };
  const label: Record<string, string> = {
    novo: "Novo",
    u_obradi: "U obradi",
    zavrseno: "Završeno",
  };
  const key = status ?? "novo";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-stamp border ${map[key]}`}>
      {label[key]}
    </span>
  );
}

export default async function UpitiPage() {
  const rows = await db.select().from(upiti).orderBy(desc(upiti.kreiran)).limit(50);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink-100">Upiti</h1>
        <p className="text-ink-400 text-sm mt-1">
          Kontakt forme i prijave sa sajta, u jednom pregledu
        </p>
      </header>

      <section className="rounded-md border border-ink-700 bg-ink-800 shadow-card">
        <div className="px-5 py-4 border-b border-ink-700 flex items-center gap-2">
          <Inbox size={16} className="text-gold" strokeWidth={1.75} />
          <h2 className="font-display text-lg text-ink-100">Svi upiti</h2>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-normal">Datum</th>
              <th className="px-5 py-3 font-normal">Ime</th>
              <th className="px-5 py-3 font-normal">Kontakt</th>
              <th className="px-5 py-3 font-normal">Poruka</th>
              <th className="px-5 py-3 font-normal">Izvor</th>
              <th className="px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-ink-700">
                <td className="px-5 py-3 text-ink-400 whitespace-nowrap">
                  {new Date(r.kreiran).toLocaleDateString("hr-HR")}
                </td>
                <td className="px-5 py-3 text-ink-100">{r.ime}</td>
                <td className="px-5 py-3 text-ink-400">
                  {r.email}
                  {r.telefon ? ` · ${r.telefon}` : ""}
                </td>
                <td className="px-5 py-3 text-ink-400 max-w-sm truncate">
                  {r.poruka}
                </td>
                <td className="px-5 py-3 text-ink-400 capitalize">
                  {r.izvor?.replace("_", " ")}
                </td>
                <td className="px-5 py-3">
                  <StatusPill status={r.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-ink-400">
                  Nema upita još — stižu automatski sa kontakt formi na sajtu.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </section>
    </div>
  );
}

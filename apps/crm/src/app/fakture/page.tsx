import { db } from "@/lib/db";
import { dolazneFakture } from "@/lib/db/schema";
import { asc, sql } from "drizzle-orm";
import { Receipt, FilePlus } from "lucide-react";
import StatCard from "@/components/StatCard";

export const revalidate = 0;

const KATEGORIJA_LABEL: Record<string, string> = {
  zlato: "Zlato",
  srebro: "Srebro",
  dijamanti: "Dijamanti",
  kamenje: "Kamenje",
  potrosni: "Potrošni materijal",
  ostalo: "Ostalo",
};

function formatDatumHR(iso: string) {
  const [g, m, d] = iso.split("-");
  return g && m && d ? `${d}.${m}.${g}.` : iso;
}

function statusZaFakturu(rokPlacanja: string, status: string) {
  if (status === "placeno") return { key: "placeno", label: "Plaćeno" };
  const danas = new Date().toISOString().slice(0, 10);
  if (rokPlacanja < danas) return { key: "kasni", label: "Kasni" };
  return { key: "neplaceno", label: "Neplaćeno" };
}

const STATUS_STYLE: Record<string, string> = {
  placeno: "border-moss/40 text-moss bg-moss/10",
  neplaceno: "border-silver/40 text-silver bg-ink-900",
  kasni: "border-rust/40 text-rust bg-rust/10",
};

export default async function FakturePage() {
  const rows = await db
    .select()
    .from(dolazneFakture)
    .orderBy(asc(dolazneFakture.rokPlacanja));

  const [{ ukupnoDugovanje }] = await db
    .select({
      ukupnoDugovanje: sql<number>`coalesce(sum(case when ${dolazneFakture.status} != 'placeno' then ${dolazneFakture.iznos} else 0 end), 0)`,
    })
    .from(dolazneFakture);

  const danas = new Date().toISOString().slice(0, 10);
  const kasneRows = rows.filter(
    (r) => r.status !== "placeno" && r.rokPlacanja < danas
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-100">
            Dolazne fakture
          </h1>
          <p className="text-ink-400 text-sm mt-1">
            Obaveze prema dobavljačima — zlato, dijamanti, kamenje i ostalo
          </p>
        </div>
        <button className="flex items-center gap-2 bg-gold text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gold-light transition-colors shadow-card">
          <FilePlus size={16} strokeWidth={2} />
          Nova faktura
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Neplaćeno ukupno"
          value={`€${(ukupnoDugovanje ?? 0).toLocaleString("hr-HR")}`}
          icon={Receipt}
        />
        <StatCard
          label="Fakture koje kasne"
          value={String(kasneRows.length)}
          icon={Receipt}
          accent="silver"
        />
        <StatCard
          label="Ukupno faktura"
          value={String(rows.length)}
          icon={Receipt}
          accent="moss"
        />
      </div>

      <section className="rounded-md border border-ink-700 bg-ink-800 shadow-card">
        <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-normal">Broj fakture</th>
              <th className="px-5 py-3 font-normal">Dobavljač</th>
              <th className="px-5 py-3 font-normal">Kategorija</th>
              <th className="px-5 py-3 font-normal">Iznos</th>
              <th className="px-5 py-3 font-normal">Rok plaćanja</th>
              <th className="px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = statusZaFakturu(r.rokPlacanja, r.status ?? "neplaceno");
              return (
                <tr key={r.id} className="border-t border-ink-700">
                  <td className="px-5 py-3 font-mono text-ink-100">
                    {r.brojFakture}
                  </td>
                  <td className="px-5 py-3 text-ink-100">{r.dobavljac}</td>
                  <td className="px-5 py-3">
                    <span className="hallmark">
                      {KATEGORIJA_LABEL[r.kategorija]}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-ink-100">
                    {r.valuta === "EUR" ? "€" : r.valuta}
                    {r.iznos.toLocaleString("hr-HR")}
                  </td>
                  <td className="px-5 py-3 text-ink-400">
                    {formatDatumHR(r.rokPlacanja)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-stamp border ${STATUS_STYLE[s.key]}`}
                    >
                      {s.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-ink-400">
                  Nema unesenih faktura još.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </section>
    </div>
  );
}

import { db } from "@/lib/db";
import { sirovine, kamenje, potrosniMaterijal } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PackagePlus } from "lucide-react";

export const revalidate = 0;

function StatusBadge({ status }: { status: string | null }) {
  const isIncoming = status === "u_dolasku";
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-stamp border ${
        isIncoming
          ? "border-rose/50 text-rose bg-rose/10"
          : "border-moss/50 text-moss bg-moss/10"
      }`}
    >
      {isIncoming ? "U dolasku" : "Na stanju"}
    </span>
  );
}

export default async function MaterijaliPage() {
  const [sirovineRows, kamenjeRows, potrosniRows] = await Promise.all([
    db.select().from(sirovine).orderBy(desc(sirovine.datum)).limit(20),
    db.select().from(kamenje).orderBy(desc(kamenje.datum)).limit(20),
    db
      .select()
      .from(potrosniMaterijal)
      .orderBy(desc(potrosniMaterijal.datum))
      .limit(20),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-100">Materijali</h1>
          <p className="text-ink-400 text-sm mt-1">
            Sirovine, kamenje i potrošni materijal — stanje i dolasci
          </p>
        </div>
        <button className="flex items-center gap-2 border border-gold/40 text-gold-light px-4 py-2.5 rounded-md text-sm hover:bg-gold/10 transition-colors">
          <PackagePlus size={16} strokeWidth={2} />
          Novi unos
        </button>
      </header>

      <section className="rounded-md border border-ink-700 bg-ink-800 shadow-card">
        <div className="px-5 py-4 border-b border-ink-700">
          <h2 className="font-display text-lg text-ink-100">Sirovine</h2>
          <p className="text-xs text-ink-400">Zlato, srebro, platina, legure</p>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-normal">Datum</th>
              <th className="px-5 py-3 font-normal">Metal</th>
              <th className="px-5 py-3 font-normal">Čistoća</th>
              <th className="px-5 py-3 font-normal">Količina</th>
              <th className="px-5 py-3 font-normal">Smjer</th>
              <th className="px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {sirovineRows.map((r) => (
              <tr key={r.id} className="border-t border-ink-700">
                <td className="px-5 py-3 text-ink-400">{r.datum}</td>
                <td className="px-5 py-3 text-ink-100">{r.vrstaMetala}</td>
                <td className="px-5 py-3">
                  <span className="hallmark">{r.cistoca}</span>
                </td>
                <td className="px-5 py-3 font-mono text-ink-100">
                  {r.kolicinaG} g
                </td>
                <td className="px-5 py-3 text-ink-400 capitalize">
                  {r.smjer}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {sirovineRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-ink-400">
                  Nema unesenih sirovina još.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </section>

      <section className="rounded-md border border-ink-700 bg-ink-800 shadow-card">
        <div className="px-5 py-4 border-b border-ink-700">
          <h2 className="font-display text-lg text-ink-100">Kamenje</h2>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-normal">Datum</th>
              <th className="px-5 py-3 font-normal">Vrsta</th>
              <th className="px-5 py-3 font-normal">Karat</th>
              <th className="px-5 py-3 font-normal">Količina</th>
              <th className="px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {kamenjeRows.map((r) => (
              <tr key={r.id} className="border-t border-ink-700">
                <td className="px-5 py-3 text-ink-400">{r.datum}</td>
                <td className="px-5 py-3 text-ink-100">{r.vrsta}</td>
                <td className="px-5 py-3 font-mono">{r.velicinaKarat}</td>
                <td className="px-5 py-3 font-mono text-ink-100">
                  {r.kolicinaKom} kom
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {kamenjeRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-ink-400">
                  Nema unesenog kamenja još.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </section>

      <section className="rounded-md border border-ink-700 bg-ink-800 shadow-card">
        <div className="px-5 py-4 border-b border-ink-700">
          <h2 className="font-display text-lg text-ink-100">
            Potrošni materijal
          </h2>
          <p className="text-xs text-ink-400">
            Lemovi, paste, kiseline, ambalaža
          </p>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-normal">Datum</th>
              <th className="px-5 py-3 font-normal">Naziv</th>
              <th className="px-5 py-3 font-normal">Količina</th>
              <th className="px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {potrosniRows.map((r) => (
              <tr key={r.id} className="border-t border-ink-700">
                <td className="px-5 py-3 text-ink-400">{r.datum}</td>
                <td className="px-5 py-3 text-ink-100">
                  {r.nazivMaterijala}
                </td>
                <td className="px-5 py-3 font-mono text-ink-100">
                  {r.kolicina} {r.jedinica}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {potrosniRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-ink-400">
                  Nema unesenog potrošnog materijala još.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </section>
    </div>
  );
}

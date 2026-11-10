import { db } from "@/lib/db";
import { narudzbe } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { ShoppingBag } from "lucide-react";
import StatCard from "@/components/StatCard";

export const revalidate = 0;

const STATUS_LABEL: Record<string, string> = {
  na_cekanju: "Na čekanju",
  u_obradi: "U obradi",
  poslano: "Poslano",
  zavrseno: "Završeno",
  otkazano: "Otkazano",
};

const STATUS_STYLE: Record<string, string> = {
  na_cekanju: "border-silver/40 text-silver bg-ink-900",
  u_obradi: "border-rose/40 text-rose bg-rose/10",
  poslano: "border-gold/40 text-gold bg-gold-dim",
  zavrseno: "border-moss/40 text-moss bg-moss/10",
  otkazano: "border-rust/40 text-rust bg-rust/10",
};

export default async function NarudzbePage() {
  const rows = await db
    .select()
    .from(narudzbe)
    .orderBy(desc(narudzbe.datum))
    .limit(50);

  const [{ ukupno, otvorene }] = await db
    .select({
      ukupno: sql<number>`coalesce(sum(${narudzbe.iznos}), 0)`,
      otvorene: sql<number>`count(case when ${narudzbe.status} in ('na_cekanju','u_obradi') then 1 end)`,
    })
    .from(narudzbe);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink-100">Narudžbe</h1>
        <p className="text-ink-400 text-sm mt-1">
          Sinkronizovano sa WooCommerce narudžbama u realnom vremenu
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Ukupno narudžbi"
          value={String(rows.length)}
          icon={ShoppingBag}
        />
        <StatCard
          label="Otvorene narudžbe"
          value={String(otvorene ?? 0)}
          icon={ShoppingBag}
          accent="silver"
        />
        <StatCard
          label="Ukupna vrijednost"
          value={`€${(ukupno ?? 0).toLocaleString("hr-HR")}`}
          icon={ShoppingBag}
          accent="moss"
        />
      </div>

      <section className="rounded-md border border-ink-700 bg-ink-800 shadow-card">
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-normal">Narudžba</th>
              <th className="px-5 py-3 font-normal">Kupac</th>
              <th className="px-5 py-3 font-normal">Iznos</th>
              <th className="px-5 py-3 font-normal">Datum</th>
              <th className="px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-ink-700">
                <td className="px-5 py-3 font-mono text-ink-100">
                  #{r.wooOrderId}
                </td>
                <td className="px-5 py-3 text-ink-400">
                  {r.kupacIme || r.kupacEmail}
                </td>
                <td className="px-5 py-3 font-mono text-ink-100">
                  €{r.iznos.toLocaleString("hr-HR")}
                </td>
                <td className="px-5 py-3 text-ink-400">
                  {new Date(r.datum).toLocaleDateString("hr-HR")}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-stamp border ${STATUS_STYLE[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-ink-400">
                  Nema narudžbi još — stižu automatski sa WooCommerce webhooka.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </section>
    </div>
  );
}

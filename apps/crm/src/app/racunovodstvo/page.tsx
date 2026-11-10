import { db } from "@/lib/db";
import { sirovine, kamenje, potrosniMaterijal } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { Download, FileSpreadsheet } from "lucide-react";
import StatCard from "@/components/StatCard";

export const revalidate = 0;

async function getTotals() {
  const [{ vrijednostSirovina }] = await db
    .select({
      vrijednostSirovina: sql<number>`coalesce(sum(case when ${sirovine.smjer} = 'ulaz' then ${sirovine.ukupno} else -${sirovine.ukupno} end), 0)`,
    })
    .from(sirovine);

  const [{ vrijednostKamenja }] = await db
    .select({
      vrijednostKamenja: sql<number>`coalesce(sum(case when ${kamenje.smjer} = 'ulaz' then ${kamenje.ukupno} else -${kamenje.ukupno} end), 0)`,
    })
    .from(kamenje);

  const [{ vrijednostPotrosnog }] = await db
    .select({
      vrijednostPotrosnog: sql<number>`coalesce(sum(case when ${potrosniMaterijal.smjer} = 'ulaz' then ${potrosniMaterijal.ukupno} else -${potrosniMaterijal.ukupno} end), 0)`,
    })
    .from(potrosniMaterijal);

  return { vrijednostSirovina, vrijednostKamenja, vrijednostPotrosnog };
}

export default async function RacunovodstvoPage() {
  const totals = await getTotals();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-100">
            Računovodstvo
          </h1>
          <p className="text-ink-400 text-sm mt-1">
            Automatski izračunato iz svih evidencija — spremno za knjigovođu
          </p>
        </div>
        <a
          href="/api/export/accounting"
          className="flex items-center gap-2 bg-gold text-ink-900 px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gold-light transition-colors"
        >
          <Download size={16} strokeWidth={2} />
          Izvezi Excel
        </a>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Vrijednost sirovina na stanju"
          value={`€${totals.vrijednostSirovina.toLocaleString("hr-HR")}`}
          icon={FileSpreadsheet}
        />
        <StatCard
          label="Vrijednost kamenja na stanju"
          value={`€${totals.vrijednostKamenja.toLocaleString("hr-HR")}`}
          icon={FileSpreadsheet}
          accent="silver"
        />
        <StatCard
          label="Vrijednost potrošnog materijala"
          value={`€${totals.vrijednostPotrosnog.toLocaleString("hr-HR")}`}
          icon={FileSpreadsheet}
          accent="moss"
        />
      </div>

      <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card p-5 text-sm text-ink-400">
        Izvoz generira isti raspored listova kao i postojeća tablica
        (Sirovine, Kamenje, Potrošni materijal, Radni nalozi, Gotovi
        proizvodi, Inventura) — knjigovođa ne mijenja ništa u svom procesu.
      </div>
    </div>
  );
}

import { db } from "@/lib/db";
import {
  cijenaZlataPovijest,
  gotoviProizvodi,
  sirovine,
  upiti,
  dolazneFakture,
  dnevnikZapisi,
} from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import StatCard from "@/components/StatCard";
import DnevnikClient from "@/components/DnevnikClient";
import {
  Coins,
  Package,
  TrendingUp,
  AlertTriangle,
  Inbox,
  Receipt,
} from "lucide-react";

export const revalidate = 0;

async function getData() {
  const [zadnjaCijenaZlata] = await db
    .select()
    .from(cijenaZlataPovijest)
    .orderBy(desc(cijenaZlataPovijest.vrijeme))
    .limit(1);

  const [{ ukupnoProizvoda }] = await db
    .select({ ukupnoProizvoda: sql<number>`count(*)` })
    .from(gotoviProizvodi)
    .where(eq(gotoviProizvodi.status, "na_zalihi"));

  const pocetakMjeseca = new Date();
  pocetakMjeseca.setDate(1);
  const [{ prodanoOvajMjesec, prihodOvajMjesec }] = await db
    .select({
      prodanoOvajMjesec: sql<number>`count(*)`,
      prihodOvajMjesec: sql<number>`coalesce(sum(${gotoviProizvodi.prodajnaCijena}), 0)`,
    })
    .from(gotoviProizvodi)
    .where(
      sql`${gotoviProizvodi.status} = 'prodano' and ${gotoviProizvodi.datumProdaje} >= ${pocetakMjeseca.toISOString().slice(0, 10)}`
    );

  const niskeZaliheSirovina = await db
    .select()
    .from(sirovine)
    .where(sql`${sirovine.status} = 'na_stanju'`)
    .limit(5);

  const [{ novihUpita }] = await db
    .select({ novihUpita: sql<number>`count(*)` })
    .from(upiti)
    .where(eq(upiti.status, "novo"));

  const danas = new Date().toISOString().slice(0, 10);
  const [{ fakturaKasni }] = await db
    .select({ fakturaKasni: sql<number>`count(*)` })
    .from(dolazneFakture)
    .where(
      sql`${dolazneFakture.status} != 'placeno' and ${dolazneFakture.rokPlacanja} < ${danas}`
    );

  const dnevnikPoslednji = await db
    .select()
    .from(dnevnikZapisi)
    .orderBy(desc(dnevnikZapisi.datum))
    .limit(5);

  return {
    zadnjaCijenaZlata,
    ukupnoProizvoda: ukupnoProizvoda ?? 0,
    prodanoOvajMjesec: prodanoOvajMjesec ?? 0,
    prihodOvajMjesec: prihodOvajMjesec ?? 0,
    niskeZaliheSirovina,
    novihUpita: novihUpita ?? 0,
    fakturaKasni: fakturaKasni ?? 0,
    dnevnikPoslednji,
  };
}

export default async function DashboardPage() {
  const data = await getData();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink-100">Početna</h1>
        <p className="text-ink-400 text-sm mt-1">
          Pregled prodaje, cijene zlata i stanja zaliha
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Cijena zlata (925 / g)"
          value={
            data.zadnjaCijenaZlata
              ? `€${data.zadnjaCijenaZlata.cijenaEurPoGramu925?.toFixed(2)}`
              : "—"
          }
          sub={
            data.zadnjaCijenaZlata
              ? `Ažurirano ${new Date(
                  data.zadnjaCijenaZlata.vrijeme
                ).toLocaleTimeString("hr-HR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Čeka se prvo osvježavanje"
          }
          icon={Coins}
        />
        <StatCard
          label="Gotovih proizvoda na zalihi"
          value={String(data.ukupnoProizvoda)}
          icon={Package}
          accent="silver"
        />
        <StatCard
          label="Prodano ovaj mjesec"
          value={String(data.prodanoOvajMjesec)}
          icon={TrendingUp}
          accent="moss"
        />
        <StatCard
          label="Prihod ovaj mjesec"
          value={`€${data.prihodOvajMjesec.toLocaleString("hr-HR")}`}
          icon={TrendingUp}
          accent="moss"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard
          label="Novi upiti"
          value={String(data.novihUpita)}
          sub="Kontakt forme koje čekaju odgovor"
          icon={Inbox}
        />
        <StatCard
          label="Fakture koje kasne"
          value={String(data.fakturaKasni)}
          sub="Rok plaćanja je prošao"
          icon={Receipt}
          accent={data.fakturaKasni > 0 ? "silver" : "moss"}
        />
      </div>

      <section className="rounded-md border border-ink-700 bg-ink-800 shadow-card mb-8">
        <div className="px-5 py-4 border-b border-ink-700 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink-100">Dnevnik</h2>
          <a
            href="/dnevnik"
            className="text-xs text-gold hover:underline"
          >
            Pogledaj sve →
          </a>
        </div>
        <div className="p-5">
          <DnevnikClient pocetniZapisi={data.dnevnikPoslednji} kompaktno />
        </div>
      </section>

      <section className="rounded-md border border-ink-700 bg-ink-800 shadow-card">
        <div className="px-5 py-4 border-b border-ink-700 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose" strokeWidth={1.75} />
          <h2 className="font-display text-lg text-ink-100">
            Sirovine na stanju
          </h2>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-normal">Metal</th>
              <th className="px-5 py-3 font-normal">Čistoća</th>
              <th className="px-5 py-3 font-normal">Količina</th>
              <th className="px-5 py-3 font-normal">Zadnji ulaz</th>
            </tr>
          </thead>
          <tbody>
            {data.niskeZaliheSirovina.map((s) => (
              <tr key={s.id} className="border-t border-ink-700">
                <td className="px-5 py-3 text-ink-100">{s.vrstaMetala}</td>
                <td className="px-5 py-3">
                  <span className="hallmark">{s.cistoca}</span>
                </td>
                <td className="px-5 py-3 font-mono text-ink-100">
                  {s.kolicinaG} g
                </td>
                <td className="px-5 py-3 text-ink-400">{s.datum}</td>
              </tr>
            ))}
            {data.niskeZaliheSirovina.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-6 text-center text-ink-400"
                >
                  Nema unesenih sirovina još.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </section>
    </div>
  );
}

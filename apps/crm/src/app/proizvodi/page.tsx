import { db } from "@/lib/db";
import { gotoviProizvodi, cijenaZlataPovijest, products } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import ProizvodiTable from "@/components/ProizvodiTable";
import KatalogProizvodiTable from "@/components/KatalogProizvodiTable";
import { Info } from "lucide-react";

export const revalidate = 0;

const KATALOG_PAGE_SIZE = 25;

export default async function ProizvodiPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const requestedPage = Number.parseInt(searchParams?.page || "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [[{ total: ukupnoUKatalogu }]] = await Promise.all([
    db.select({ total: count() }).from(products),
  ]);
  const ukupnoStranica = Math.max(1, Math.ceil(ukupnoUKatalogu / KATALOG_PAGE_SIZE));
  const trenutnaStranica = Math.min(page, ukupnoStranica);

  const [katalog, proizvodi, [cijenaZlata]] = await Promise.all([
    db.select().from(products).orderBy(products.position, products.id).limit(KATALOG_PAGE_SIZE).offset((trenutnaStranica - 1) * KATALOG_PAGE_SIZE),
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
        <h1 className="font-display text-3xl text-ink-100">Katalog proizvoda</h1>
        <p className="text-ink-400 text-sm mt-1">
          Proizvodi koji se prikazuju na palladio.hr
        </p>
      </header>

      <div className="mb-6 flex items-center justify-between rounded-md border border-moss/30 bg-moss/5 px-4 py-3 text-sm">
        <span className="text-ink-100 font-medium">{ukupnoUKatalogu} proizvoda u katalogu</span>
        <span className="text-ink-400">Katalog i sajt koriste istu bazu.</span>
      </div>

      <KatalogProizvodiTable
        proizvodi={katalog}
        trenutnaStranica={trenutnaStranica}
        ukupnoStranica={ukupnoStranica}
        ukupnoProizvoda={ukupnoUKatalogu}
      />

      {proizvodi.length > 0 && <><div className="mt-10 mb-6 flex items-start gap-2 text-xs text-ink-400 bg-ink-800 border border-ink-700 rounded-md px-4 py-3 shadow-card">
        <Info size={14} className="mt-0.5 shrink-0 text-gold" />
        <span>
          Predložena cijena = težina × cijena zlata po gramu za tu čistoću ×
          faktor marže (trenutno 2.4×). Prilagodi faktor u{" "}
          <code className="text-ink-100">ProizvodiTable.tsx</code> kad budeš
          znao stvarnu formulu (rad, kamenje, itd).
        </span>
      </div>

      <ProizvodiTable proizvodi={proizvodi} cijenaZlata={cijenaZlata ?? null} /></>}
    </div>
  );
}

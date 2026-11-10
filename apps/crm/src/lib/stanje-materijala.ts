import { db } from "@/lib/db";
import { sirovine, kamenje, potrosniMaterijal } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

/** Current balance (g) for a metal at a given purity — sum(ulaz) - sum(izlaz). */
export async function stanjeSirovine(vrstaMetala: string, cistoca: number): Promise<number> {
  const [row] = await db
    .select({
      stanje: sql<number>`coalesce(sum(case when ${sirovine.smjer} = 'ulaz' then ${sirovine.kolicinaG} else -${sirovine.kolicinaG} end), 0)`,
    })
    .from(sirovine)
    .where(sql`${sirovine.vrstaMetala} = ${vrstaMetala} and ${sirovine.cistoca} = ${cistoca}`);
  return row?.stanje ?? 0;
}

/** Current balance (kom) for a stone type. */
export async function stanjeKamenja(vrsta: string): Promise<number> {
  const [row] = await db
    .select({
      stanje: sql<number>`coalesce(sum(case when ${kamenje.smjer} = 'ulaz' then ${kamenje.kolicinaKom} else -${kamenje.kolicinaKom} end), 0)`,
    })
    .from(kamenje)
    .where(sql`${kamenje.vrsta} = ${vrsta}`);
  return row?.stanje ?? 0;
}

/** Current balance for a consumable, by name. */
export async function stanjePotrosnog(nazivMaterijala: string): Promise<number> {
  const [row] = await db
    .select({
      stanje: sql<number>`coalesce(sum(case when ${potrosniMaterijal.smjer} = 'ulaz' then ${potrosniMaterijal.kolicina} else -${potrosniMaterijal.kolicina} end), 0)`,
    })
    .from(potrosniMaterijal)
    .where(sql`${potrosniMaterijal.nazivMaterijala} = ${nazivMaterijala}`);
  return row?.stanje ?? 0;
}

/**
 * Parses a BOM line's "naziv" (e.g. "Au 585") into metal + purity for the
 * zlato/srebro/platina material types, which are tracked against `sirovine`
 * by (vrstaMetala, cistoca) rather than by free-text name.
 */
export function raščlaniMetalNaziv(naziv: string): { vrstaMetala: string; cistoca: number } | null {
  const match = naziv.match(/^([A-Za-zČĆŠĐŽčćšđž]+)\s+(\d{3})$/);
  if (!match) return null;
  return { vrstaMetala: match[1], cistoca: Number(match[2]) };
}

/** Checks a BOM line's stock and returns the shortfall (0 or negative = fine). */
export async function provjeriDostupnost(
  tip: string,
  naziv: string,
  potrebnaKolicina: number
): Promise<{ dostupno: number; nedostaje: number }> {
  let dostupno = 0;

  if (tip === "zlato" || tip === "srebro" || tip === "platina") {
    const raščlan = raščlaniMetalNaziv(naziv);
    dostupno = raščlan ? await stanjeSirovine(raščlan.vrstaMetala, raščlan.cistoca) : 0;
  } else if (tip === "dijamant" || tip === "cirkon" || tip === "kamenje") {
    dostupno = await stanjeKamenja(naziv);
  } else {
    dostupno = await stanjePotrosnog(naziv);
  }

  return { dostupno, nedostaje: Math.max(0, potrebnaKolicina - dostupno) };
}

import { db } from "@/lib/db";
import { proizvodMaterijali, radniNalozi } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { provjeriDostupnost } from "@/lib/stanje-materijala";

const JEDINICA_LABEL: Record<string, string> = {
  g: "g",
  kom: "kom",
  ct: "ct",
};

/**
 * For one order line (a product × quantity ordered), checks every BOM
 * component against current stock. If anything is short, creates a radni
 * nalog listing exactly what's missing and how much — so production knows
 * what to procure/produce, and the order isn't silently stuck.
 * Returns the created nalog, or null if stock was sufficient (nothing to do).
 */
export async function provjeriIKreirajNalogAkoNedostaje(
  proizvodId: number,
  opisProizvoda: string,
  kolicinaNarucena: number,
  narudzbaId: number,
  brojNarudzbe: number
) {
  const bom = await db
    .select()
    .from(proizvodMaterijali)
    .where(eq(proizvodMaterijali.proizvodId, proizvodId));

  if (bom.length === 0) return null; // no BOM defined — nothing to check

  const nedostajuci: string[] = [];

  for (const stavka of bom) {
    const potrebno = stavka.potrebnaKolicina * kolicinaNarucena;
    const { nedostaje } = await provjeriDostupnost(stavka.tip, stavka.naziv, potrebno);
    if (nedostaje > 0) {
      const jed = JEDINICA_LABEL[stavka.jedinica] ?? stavka.jedinica;
      nedostajuci.push(`${stavka.naziv}: nedostaje ${nedostaje.toFixed(2)} ${jed}`);
    }
  }

  if (nedostajuci.length === 0) return null; // fully in stock — no nalog needed

  const danas = new Date().toISOString().slice(0, 10);
  const [g, m, d] = danas.split("-");
  const brojNaloga = `AUTO-${brojNarudzbe}-${Date.now().toString().slice(-4)}`;

  const [nalog] = await db
    .insert(radniNalozi)
    .values({
      brojNaloga,
      datumPocetka: `${d}.${m}.${g}`,
      opisProizvoda: `${opisProizvoda} (${kolicinaNarucena}x) — porudžbina #${brojNarudzbe}`,
      napomena: "Automatski generisan — nema dovoljno materijala na stanju za ovu porudžbinu.",
      potrebniMaterijali: nedostajuci.join("; "),
      status: "u_izradi",
      izvorNarudzbaId: narudzbaId,
    })
    .returning();

  return nalog;
}

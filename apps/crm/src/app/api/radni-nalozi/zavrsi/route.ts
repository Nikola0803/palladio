import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { radniNalozi, gotoviProizvodi } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { id, sifraGotovog, tezinaGotovogG, otpadG, nabavnaVrijednost } = await req.json();

  const [nalog] = await db
    .select()
    .from(radniNalozi)
    .where(eq(radniNalozi.id, id))
    .limit(1);

  if (!nalog) {
    return NextResponse.json({ error: "Nalog nije pronađen" }, { status: 404 });
  }

  const danas = new Date().toISOString().slice(0, 10);
  const danasHR = formatDatumHR(danas);

  await db
    .update(radniNalozi)
    .set({
      status: "zavrseno",
      datumZavrsetka: danasHR,
      sifraGotovog,
      tezinaGotovogG,
      otpadG,
    })
    .where(eq(radniNalozi.id, id));

  const [proizvod] = await db
    .insert(gotoviProizvodi)
    .values({
      sifra: sifraGotovog,
      opis: nalog.opisProizvoda,
      metalCistoca: nalog.metal,
      tezinaG: tezinaGotovogG,
      kamenjeOpis: nalog.kamenjeOpis,
      datumZavrsetka: danasHR,
      nabavnaVrijednost,
      status: "na_zalihi",
    })
    .returning();

  return NextResponse.json({ ok: true, proizvod });
}

function formatDatumHR(iso: string) {
  const [g, m, d] = iso.split("-");
  return `${d}.${m}.${g}`;
}

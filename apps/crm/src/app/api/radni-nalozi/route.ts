import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { radniNalozi, sirovine } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const {
    brojNaloga,
    opisProizvoda,
    vrstaMetala,
    cistoca,
    utrosenoG,
    kamenjeOpis,
    potrosniMaterijalOpis,
  } = await req.json();

  if (!brojNaloga || !opisProizvoda || !vrstaMetala || !cistoca || !utrosenoG) {
    return NextResponse.json({ error: "Nedostaju obavezna polja" }, { status: 400 });
  }

  const danas = new Date().toISOString().slice(0, 10);

  // Log the consumption as an "izlaz" ledger entry against the raw metal —
  // consistent with how the source spreadsheet tracks material in/out.
  await db.insert(sirovine).values({
    datum: formatDatumHR(danas),
    brojDokumenta: brojNaloga,
    vrstaMetala,
    cistoca,
    kolicinaG: utrosenoG,
    smjer: "izlaz",
    napomena: `Utrošeno za nalog ${brojNaloga}`,
    status: "na_stanju",
  });

  const [nalog] = await db
    .insert(radniNalozi)
    .values({
      brojNaloga,
      datumPocetka: formatDatumHR(danas),
      opisProizvoda,
      metal: `${vrstaMetala} ${cistoca}`,
      utrosenoG,
      kamenjeOpis,
      potrosniMaterijalOpis,
      status: "u_izradi",
    })
    .returning();

  return NextResponse.json({ ok: true, nalog });
}

function formatDatumHR(iso: string) {
  const [g, m, d] = iso.split("-");
  return `${d}.${m}.${g}`;
}

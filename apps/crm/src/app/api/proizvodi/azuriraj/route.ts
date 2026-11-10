import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gotoviProizvodi } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { id, opis, sifra, prodajnaCijena, status, tezinaG, metalCistoca } = await req.json();

  if (typeof id !== "number") {
    return NextResponse.json({ error: "Nedostaje id" }, { status: 400 });
  }

  const [proizvod] = await db
    .update(gotoviProizvodi)
    .set({
      ...(opis !== undefined && { opis }),
      ...(sifra !== undefined && { sifra }),
      ...(prodajnaCijena !== undefined && { prodajnaCijena }),
      ...(status !== undefined && { status }),
      ...(tezinaG !== undefined && { tezinaG }),
      ...(metalCistoca !== undefined && { metalCistoca }),
    })
    .where(eq(gotoviProizvodi.id, id))
    .returning();

  if (!proizvod) {
    return NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, proizvod });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentLinks, kupci } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// GET /api/payment-links — lista svih
export async function GET() {
  const rows = await db
    .select({
      id: paymentLinks.id,
      token: paymentLinks.token,
      kupacId: paymentLinks.kupacId,
      kupacIme: paymentLinks.kupacIme,
      ime: kupci.ime,
      prezime: kupci.email,
      opis: paymentLinks.opis,
      iznos: paymentLinks.iznos,
      valuta: paymentLinks.valuta,
      status: paymentLinks.status,
      heroImage: paymentLinks.heroImage,
      napomena: paymentLinks.napomena,
      kreirano: paymentLinks.kreirano,
      placenoAt: paymentLinks.placenoAt,
    })
    .from(paymentLinks)
    .leftJoin(kupci, eq(paymentLinks.kupacId, kupci.id))
    .orderBy(desc(paymentLinks.id))
    .limit(200);
  return NextResponse.json(rows);
}

// POST /api/payment-links — kreiraj novi
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { kupacIme, kupacId, opis, iznos, valuta, heroImage, napomena } = body;

  if (!iznos || isNaN(Number(iznos))) {
    return NextResponse.json({ error: "Iznos je obavezan." }, { status: 400 });
  }

  const token = randomUUID();
  const [row] = await db
    .insert(paymentLinks)
    .values({
      token,
      kupacId: kupacId || null,
      kupacIme: kupacIme || null,
      opis: opis || null,
      iznos: Number(iznos),
      valuta: valuta || "EUR",
      heroImage: heroImage || null,
      napomena: napomena || null,
      status: "aktivan",
    })
    .returning();

  return NextResponse.json({ paymentLink: row }, { status: 201 });
}

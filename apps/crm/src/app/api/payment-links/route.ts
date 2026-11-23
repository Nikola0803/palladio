import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentLinks, kupci } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { serializePaymentLinkMeta, type PaymentLinkItem } from "@/lib/payment-link-items";

export const dynamic = "force-dynamic";

// GET /api/payment-links — lista svih
export async function GET() {
  const rows = await db
    .select({
      id: paymentLinks.id,
      token: paymentLinks.token,
      kupacId: paymentLinks.kupacId,
      kupacIme: paymentLinks.kupacIme,
      kupacEmail: paymentLinks.kupacEmail,
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
  const { kupacIme, kupacEmail, kupacId, opis, iznos, valuta, heroImage, napomena, stavke, rucniUkupno } = body;

  const items: PaymentLinkItem[] = Array.isArray(stavke) ? stavke.map((item) => ({
    productId: Number.isInteger(Number(item.productId)) ? Number(item.productId) : undefined,
    name: String(item.name || "").trim(), quantity: Math.max(1, Number(item.quantity) || 1), unitPrice: Math.max(0, Number(item.unitPrice) || 0),
  })).filter((item) => item.name) : [];
  const calculatedTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = rucniUkupno || !items.length ? Number(iznos) : calculatedTotal;
  if (!total || total < 0.5) return NextResponse.json({ error: "Iznos je obavezan." }, { status: 400 });
  const token = randomUUID();
  const [row] = await db
    .insert(paymentLinks)
    .values({
      token,
      kupacId: kupacId || null,
      kupacIme: kupacIme || null,
      kupacEmail: kupacEmail || null,
      opis: opis || null,
      iznos: total,
      valuta: valuta || "EUR",
      heroImage: heroImage || null,
      napomena: serializePaymentLinkMeta({ note: napomena || "", items, manualTotal: Boolean(rucniUkupno) }),
      status: "aktivan",
    })
    .returning();

  return NextResponse.json({ paymentLink: row }, { status: 201 });
}

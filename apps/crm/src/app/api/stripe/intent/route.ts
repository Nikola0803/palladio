import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * POST /api/stripe/intent
 * Kreira Stripe PaymentIntent za payment link token.
 * Poziva se s /plati/[token] frontenda (CRM ili palladio.hr web app).
 * Body: { token: string }
 */
export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token nedostaje." }, { status: 400, headers: CORS });
  }

  const [row] = await db
    .select()
    .from(paymentLinks)
    .where(eq(paymentLinks.token, token))
    .limit(1);

  if (!row || row.status !== "aktivan") {
    return NextResponse.json(
      { error: "Link nije aktivan ili ne postoji." },
      { status: 404, headers: CORS }
    );
  }

  const sk = (process.env.STRIPE_SECRET_KEY || "").replace(/^﻿/, "").trim();
  if (!sk) {
    return NextResponse.json({ error: "Stripe nije konfiguriran." }, { status: 500, headers: CORS });
  }

  const amountInt = Math.round(Number(row.iznos) * 100);
  if (amountInt < 50) {
    return NextResponse.json({ error: "Iznos je prenizak." }, { status: 400 });
  }

  const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: String(amountInt),
      currency: (row.valuta || "eur").toLowerCase(),
      description: row.opis || "",
      "metadata[payment_link_id]": String(row.id),
      "metadata[token]": token,
      "metadata[customer_name]": row.kupacIme || "",
      "automatic_payment_methods[enabled]": "true",
    }),
  });

  const data = await stripeRes.json();

  if (!data.client_secret) {
    return NextResponse.json(
      { error: data.error?.message || "Stripe greška." },
      { status: 502, headers: CORS }
    );
  }

  // Spremi intent ID na payment link
  await db
    .update(paymentLinks)
    .set({ stripePaymentIntentId: data.id, azurirano: new Date() })
    .where(eq(paymentLinks.token, token));

  return NextResponse.json({
    client_secret: data.client_secret,
    amount: amountInt,
    currency: (row.valuta || "eur").toLowerCase(),
    customer_name: row.kupacIme || "",
    description: row.opis || "",
    hero_image: row.heroImage || "",
  }, { headers: CORS });
}

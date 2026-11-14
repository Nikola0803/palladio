import { NextRequest, NextResponse } from "next/server";

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
 * POST /api/stripe/cart-intent
 * Kreira Stripe PaymentIntent za cart checkout (ne za payment links).
 * Poziva se iz web storefront-a.
 * Body: { amount: number (cents), currency: string, order_id?: number }
 */
export async function POST(req: NextRequest) {
  const { amount, currency, order_id } = await req.json();

  if (!amount || amount < 50) {
    return NextResponse.json({ error: "Iznos je prenizak." }, { status: 400, headers: CORS });
  }

  const sk = (process.env.STRIPE_SECRET_KEY || "").replace(/^﻿/, "").trim();
  if (!sk) {
    return NextResponse.json({ error: "Stripe nije konfiguriran." }, { status: 500, headers: CORS });
  }

  const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: String(Math.round(amount)),
      currency: (currency || "eur").toLowerCase(),
      ...(order_id ? { "metadata[order_id]": String(order_id) } : {}),
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

  return NextResponse.json({
    client_secret: data.client_secret,
    intent_id: data.id,
  }, { headers: CORS });
}

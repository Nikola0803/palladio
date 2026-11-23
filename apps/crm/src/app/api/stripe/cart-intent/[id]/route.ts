import { NextRequest, NextResponse } from "next/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Associates the already-rendered checkout PaymentIntent with the Woo order
// immediately before confirmation. The client secret is checked against
// Stripe, preventing arbitrary intent IDs from being linked to orders.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { order_id, client_secret } = await req.json().catch(() => ({}));
  const orderId = Number(order_id);
  const secret = typeof client_secret === "string" ? client_secret : "";
  const stripeKey = (process.env.STRIPE_SECRET_KEY || "").replace(/^﻿/, "").trim();
  if (!Number.isInteger(orderId) || orderId < 1 || !secret || !stripeKey) {
    return NextResponse.json({ error: "Neispravni podaci za plaćanje." }, { status: 400, headers: CORS });
  }

  const check = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(params.id)}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const intent = await check.json();
  if (!check.ok || intent.client_secret !== secret) {
    return NextResponse.json({ error: "PaymentIntent nije pronađen." }, { status: 404, headers: CORS });
  }

  const update = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(params.id)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ "metadata[order_id]": String(orderId) }),
  });
  if (!update.ok) return NextResponse.json({ error: "Narudžba se nije mogla povezati s plaćanjem." }, { status: 502, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}

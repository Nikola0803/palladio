import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: { type: string; data: { object: Record<string, unknown> } };

  if (secret && sig) {
    // Verify signature when secret is configured
    const { createHmac } = await import("crypto");
    const parts = sig.split(",").reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split("=");
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts["t"];
    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    if (expected !== parts["v1"]) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as { metadata?: { payment_link_id?: string } };
    const linkId = pi.metadata?.payment_link_id;
    if (linkId) {
      await db
        .update(paymentLinks)
        .set({ status: "placen", placenoAt: new Date(), azurirano: new Date() })
        .where(eq(paymentLinks.id, Number(linkId)));
    }
  }

  return NextResponse.json({ received: true });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentLinks, kupci, narudzbe, narudzbaStavke } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSvePostavke } from "@/lib/settings";
import { wooOznaciNarudzbuPlacenom } from "@/lib/woocommerce";
import { paymentLinkMeta } from "@/lib/payment-link-items";

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
    const pi = event.data.object as { id?: string; metadata?: { payment_link_id?: string; order_id?: string } };
    const linkId = pi.metadata?.payment_link_id;
    if (linkId) {
      const [link] = await db.select().from(paymentLinks).where(eq(paymentLinks.id, Number(linkId))).limit(1);
      await db
        .update(paymentLinks)
        .set({ status: "placen", placenoAt: new Date(), azurirano: new Date() })
        .where(eq(paymentLinks.id, Number(linkId)));
      if (link) {
        let customerId = link.kupacId;
        if (!customerId && link.kupacEmail) {
          const [customer] = await db.insert(kupci).values({
            ime: link.kupacIme || link.kupacEmail, email: link.kupacEmail, kreiran: new Date().toISOString(),
          }).onConflictDoUpdate({ target: kupci.email, set: { ime: link.kupacIme || link.kupacEmail } }).returning();
          customerId = customer.id;
          await db.update(paymentLinks).set({ kupacId: customerId }).where(eq(paymentLinks.id, link.id));
        }
        const externalOrderId = -link.id;
        const [existingOrder] = await db.select().from(narudzbe).where(eq(narudzbe.wooOrderId, externalOrderId)).limit(1);
        const [order] = await db.insert(narudzbe).values({
          wooOrderId: externalOrderId, kupacIme: link.kupacIme, kupacEmail: link.kupacEmail, iznos: link.iznos,
          status: "zavrseno", datum: new Date().toISOString(), napomena: `Payment link #${link.id}`,
        }).onConflictDoUpdate({ target: narudzbe.wooOrderId, set: { status: "zavrseno", iznos: link.iznos } }).returning();
        if (!existingOrder) for (const item of paymentLinkMeta(link.napomena).items) {
          await db.insert(narudzbaStavke).values({ narudzbaId: order.id, wooProductId: item.productId || null, naziv: item.name, kolicina: item.quantity });
        }
      }
    }

    const orderId = Number(pi.metadata?.order_id);
    if (Number.isInteger(orderId) && orderId > 0 && pi.id) {
      const settings = await getSvePostavke();
      const siteUrl = settings.WC_SITE_URL || settings.WP_SITE_URL;
      if (siteUrl && settings.WOOCOMMERCE_CONSUMER_KEY && settings.WOOCOMMERCE_CONSUMER_SECRET) {
        await wooOznaciNarudzbuPlacenom(
          { siteUrl, consumerKey: settings.WOOCOMMERCE_CONSUMER_KEY, consumerSecret: settings.WOOCOMMERCE_CONSUMER_SECRET },
          orderId,
          pi.id
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}

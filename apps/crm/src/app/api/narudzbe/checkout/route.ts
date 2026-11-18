import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { narudzbe, narudzbaStavke, kupci } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface BillingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address_1: string;
  city: string;
  postcode: string;
  country: string;
}

async function ensureColumns() {
  await sql`ALTER TABLE narudzbe ALTER COLUMN woo_order_id DROP NOT NULL`.catch(() => {});
  await sql`ALTER TABLE narudzbe ADD COLUMN IF NOT EXISTS kupac_adresa text`.catch(() => {});
  await sql`ALTER TABLE narudzbe ADD COLUMN IF NOT EXISTS kupac_grad text`.catch(() => {});
  await sql`ALTER TABLE narudzbe ADD COLUMN IF NOT EXISTS kupac_postanski text`.catch(() => {});
  await sql`ALTER TABLE narudzbe ADD COLUMN IF NOT EXISTS kupac_drzava text`.catch(() => {});
  await sql`ALTER TABLE narudzbe ADD COLUMN IF NOT EXISTS kupac_telefon text`.catch(() => {});
  await sql`ALTER TABLE narudzbe ADD COLUMN IF NOT EXISTS stripe_intent_id text`.catch(() => {});
  await sql`ALTER TABLE narudzba_stavke ADD COLUMN IF NOT EXISTS cijena real`.catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      items: CartItem[];
      billing: BillingAddress;
      stripeIntentId: string;
      note?: string;
    };

    const { items, billing, stripeIntentId, note } = body;

    if (!items?.length || !billing?.email || !stripeIntentId) {
      return NextResponse.json(
        { ok: false, error: "Nedostaju podaci (items, billing, stripeIntentId)" },
        { status: 400, headers: CORS }
      );
    }

    await ensureColumns();

    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const now = new Date().toISOString();
    const kupacIme = `${billing.first_name} ${billing.last_name}`.trim();

    // Find or create customer
    const existing = await db
      .select({ id: kupci.id })
      .from(kupci)
      .where(eq(kupci.email, billing.email))
      .limit(1);

    if (existing.length === 0) {
      await db
        .insert(kupci)
        .values({
          ime: kupacIme,
          email: billing.email,
          telefon: billing.phone ?? null,
          grad: billing.city,
          kreiran: now,
        })
        .onConflictDoNothing();
    }

    // Create order using raw SQL to handle columns that may have just been added
    const orderResult = await sql`
      INSERT INTO narudzbe (
        kupac_ime, kupac_email,
        kupac_adresa, kupac_grad, kupac_postanski, kupac_drzava, kupac_telefon,
        stripe_intent_id,
        iznos, status, datum, napomena
      ) VALUES (
        ${kupacIme}, ${billing.email},
        ${billing.address_1}, ${billing.city}, ${billing.postcode},
        ${billing.country}, ${billing.phone ?? null},
        ${stripeIntentId},
        ${total}, 'pending', ${now}, ${note ?? null}
      )
      RETURNING id
    `;

    const orderId = orderResult.rows[0].id as number;

    // Create order items
    for (const item of items) {
      await sql`
        INSERT INTO narudzba_stavke (narudzba_id, woo_product_id, naziv, kolicina, cijena)
        VALUES (${orderId}, ${item.id}, ${item.name}, ${item.quantity}, ${item.price})
      `;
    }

    return NextResponse.json({ ok: true, orderId }, { headers: CORS });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Server error" },
      { status: 500, headers: CORS }
    );
  }
}

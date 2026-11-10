import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gotoviProizvodi } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPostavka } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { id, cijena, posaljiUWoo } = await req.json();

  if (typeof id !== "number" || typeof cijena !== "number") {
    return NextResponse.json({ error: "Nevažeći podaci" }, { status: 400 });
  }

  const [proizvod] = await db
    .update(gotoviProizvodi)
    .set({ prodajnaCijena: cijena })
    .where(eq(gotoviProizvodi.id, id))
    .returning();

  if (!proizvod) {
    return NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 });
  }

  if (posaljiUWoo && proizvod.wooProductId) {
    const wpUrl = await getPostavka("WP_SITE_URL");
    const apiKey = await getPostavka("WP_CRM_API_KEY");

    if (!wpUrl || !apiKey) {
      return NextResponse.json(
        { ok: true, proizvod, wooSync: "preskočeno — WP_SITE_URL nije podešen" },
        { status: 200 }
      );
    }

    try {
      const wooRes = await fetch(
        `${wpUrl.replace(/\/$/, "")}/wp-json/jewelry-crm/v1/update-price`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            product_id: proizvod.wooProductId,
            price: cijena,
          }),
        }
      );

      if (!wooRes.ok) {
        return NextResponse.json(
          { ok: true, proizvod, wooSync: `greška (${wooRes.status})` },
          { status: 200 }
        );
      }

      await db
        .update(gotoviProizvodi)
        .set({ wooSyncedAt: new Date().toISOString() })
        .where(eq(gotoviProizvodi.id, id));

      return NextResponse.json({ ok: true, proizvod, wooSync: "poslano" });
    } catch {
      return NextResponse.json(
        { ok: true, proizvod, wooSync: "greška u povezivanju" },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ ok: true, proizvod });
}

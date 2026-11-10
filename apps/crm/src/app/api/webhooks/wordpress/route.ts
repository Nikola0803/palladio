import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { narudzbe, narudzbaStavke, gotoviProizvodi, kupci, upiti } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPostavka } from "@/lib/settings";
import { provjeriIKreirajNalogAkoNedostaje } from "@/lib/auto-radni-nalog";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const kljuc = await getPostavka("WP_CRM_API_KEY");
  if (!kljuc || auth !== `Bearer ${kljuc}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { event, data } = await req.json();

  switch (event) {
    case "order_status_changed": {
      const [sacuvanaNarudzba] = await db
        .insert(narudzbe)
        .values({
          wooOrderId: data.order_id,
          kupacIme: data.customer_name || null,
          kupacEmail: data.customer_email,
          iznos: data.total,
          status: mapWooStatus(data.status),
          datum: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: narudzbe.wooOrderId,
          set: { status: mapWooStatus(data.status), iznos: data.total },
        })
        .returning();

      for (const stavka of data.line_items ?? []) {
        let proizvodId: number | null = null;
        if (stavka.product_id) {
          const [proizvod] = await db
            .select()
            .from(gotoviProizvodi)
            .where(eq(gotoviProizvodi.wooProductId, stavka.product_id))
            .limit(1);
          proizvodId = proizvod?.id ?? null;
        }

        await db.insert(narudzbaStavke).values({
          narudzbaId: sacuvanaNarudzba.id,
          wooProductId: stavka.product_id ?? null,
          proizvodId,
          naziv: stavka.name,
          kolicina: stavka.quantity ?? 1,
        });

        if (proizvodId) {
          await provjeriIKreirajNalogAkoNedostaje(
            proizvodId,
            stavka.name,
            stavka.quantity ?? 1,
            sacuvanaNarudzba.id,
            data.order_id
          );
        }
      }
      break;
    }

    case "customer_created": {
      await db
        .insert(kupci)
        .values({
          wooCustomerId: data.customer_id,
          ime: data.name || data.email,
          email: data.email,
          kreiran: new Date().toISOString(),
        })
        .onConflictDoNothing({ target: kupci.email });
      break;
    }

    case "contact_form_submitted": {
      await db.insert(upiti).values({
        ime: data.name || "Nepoznato",
        email: data.email || "",
        telefon: data.phone,
        poruka: data.message,
        izvor: "kontakt_forma",
        kreiran: new Date().toISOString(),
      });
      break;
    }

    case "product_updated": {
      // Reserved: hook up once /proizvodi does live Woo sync.
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

function mapWooStatus(
  wooStatus: string
): "na_cekanju" | "u_obradi" | "poslano" | "zavrseno" | "otkazano" {
  switch (wooStatus) {
    case "pending":
    case "on-hold":
      return "na_cekanju";
    case "processing":
      return "u_obradi";
    case "shipped":
      return "poslano";
    case "completed":
      return "zavrseno";
    case "cancelled":
    case "refunded":
    case "failed":
      return "otkazano";
    default:
      return "na_cekanju";
  }
}

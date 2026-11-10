import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gotoviProizvodi, narudzbe, narudzbaStavke, kupci } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSvePostavke } from "@/lib/settings";
import { wooDohvatiProizvode, wooDohvatiNarudzbe, wooDohvatiKupce } from "@/lib/woocommerce";
import { provjeriIKreirajNalogAkoNedostaje } from "@/lib/auto-radni-nalog";

export const dynamic = "force-dynamic";

function mapWooStatus(
  wooStatus: string
): "na_cekanju" | "u_obradi" | "poslano" | "zavrseno" | "otkazano" {
  switch (wooStatus) {
    case "pending":
    case "on-hold":
      return "na_cekanju";
    case "processing":
      return "u_obradi";
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

export async function POST() {
  const p = await getSvePostavke();
  const siteUrl = p.WC_SITE_URL || p.WP_SITE_URL;

  if (!siteUrl || !p.WOOCOMMERCE_CONSUMER_KEY || !p.WOOCOMMERCE_CONSUMER_SECRET) {
    return NextResponse.json(
      { error: "Nedostaje URL sajta ili WooCommerce ključevi" },
      { status: 400 }
    );
  }

  const kred = {
    siteUrl,
    consumerKey: p.WOOCOMMERCE_CONSUMER_KEY,
    consumerSecret: p.WOOCOMMERCE_CONSUMER_SECRET,
  };

  const rezultat = {
    proizvodi: 0,
    narudzbe: 0,
    kupci: 0,
    autoNalozi: 0,
    greske: [] as string[],
  };

  try {
    const proizvodi = await wooDohvatiProizvode(kred, 30);
    for (const prod of proizvodi) {
      await db
        .insert(gotoviProizvodi)
        .values({
          sifra: prod.sku || `WOO-${prod.id}`,
          opis: prod.name,
          prodajnaCijena: prod.price ? Number(prod.price) : null,
          status: prod.stock_status === "instock" ? "na_zalihi" : "prodano",
          wooProductId: prod.id,
          wooSyncedAt: new Date().toISOString(),
          wooSirovoJson: JSON.stringify(prod),
        })
        .onConflictDoUpdate({
          target: gotoviProizvodi.sifra,
          set: {
            opis: prod.name,
            prodajnaCijena: prod.price ? Number(prod.price) : null,
            wooProductId: prod.id,
            wooSyncedAt: new Date().toISOString(),
            wooSirovoJson: JSON.stringify(prod),
          },
        });
      rezultat.proizvodi++;
    }
  } catch (e) {
    rezultat.greske.push(`Proizvodi: ${e instanceof Error ? e.message : "greška"}`);
  }

  try {
    const woNarudzbe = await wooDohvatiNarudzbe(kred, 30);
    for (const nar of woNarudzbe) {
      const [sacuvanaNarudzba] = await db
        .insert(narudzbe)
        .values({
          wooOrderId: nar.id,
          kupacIme: `${nar.billing?.first_name ?? ""} ${nar.billing?.last_name ?? ""}`.trim() || null,
          kupacEmail: nar.billing?.email || null,
          iznos: Number(nar.total) || 0,
          status: mapWooStatus(nar.status),
          datum: nar.date_created || new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: narudzbe.wooOrderId,
          set: { status: mapWooStatus(nar.status), iznos: Number(nar.total) || 0 },
        })
        .returning();
      rezultat.narudzbe++;

      // Fallback: many stores (like this test one) only have guest checkout,
      // so the dedicated /customers endpoint comes back empty even though
      // real customer info exists on every order. Backfill from billing info.
      if (nar.billing?.email) {
        const ime =
          `${nar.billing?.first_name ?? ""} ${nar.billing?.last_name ?? ""}`.trim() ||
          nar.billing.email;
        await db
          .insert(kupci)
          .values({ ime, email: nar.billing.email, kreiran: nar.date_created || new Date().toISOString() })
          .onConflictDoNothing({ target: kupci.email });
      }

      // Line items — needed for the BOM/material-shortage check below.
      for (const stavka of nar.line_items ?? []) {
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
          const nalog = await provjeriIKreirajNalogAkoNedostaje(
            proizvodId,
            stavka.name,
            stavka.quantity ?? 1,
            sacuvanaNarudzba.id,
            nar.id
          );
          if (nalog) rezultat.autoNalozi++;
        }
      }
    }
  } catch (e) {
    rezultat.greske.push(`Narudžbe: ${e instanceof Error ? e.message : "greška"}`);
  }

  try {
    const woKupci = await wooDohvatiKupce(kred, 30);
    for (const k of woKupci) {
      if (!k.email) continue;
      await db
        .insert(kupci)
        .values({
          wooCustomerId: k.id,
          ime: `${k.first_name ?? ""} ${k.last_name ?? ""}`.trim() || k.email,
          email: k.email,
          kreiran: k.date_created || new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: kupci.email,
          set: { wooCustomerId: k.id },
        });
    }
  } catch (e) {
    rezultat.greske.push(`Kupci: ${e instanceof Error ? e.message : "greška"}`);
  }

  const kupciUkupno = await db.select().from(kupci);
  rezultat.kupci = kupciUkupno.length;

  return NextResponse.json({ ok: true, ...rezultat });
}

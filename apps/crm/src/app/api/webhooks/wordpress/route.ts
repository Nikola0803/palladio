import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { narudzbe, narudzbaStavke, gotoviProizvodi, kupci, upiti, products } from "@/lib/db/schema";
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
      // data: WooCommerce product object (same shape as /wc/v3/products/:id)
      if (data?.id) {
        const row = {
          id: data.id as number,
          type: (data.type as string) || "simple",
          sku: (data.sku as string) || null,
          name: (data.name as string) || "",
          slug: (data.slug as string) || null,
          published: data.status === "publish",
          shortDescription: (data.short_description as string) || null,
          description: (data.description as string) || null,
          regularPrice: data.regular_price ? parseFloat(data.regular_price as string) : null,
          salePrice: data.sale_price ? parseFloat(data.sale_price as string) : null,
          categories: Array.isArray(data.categories)
            ? (data.categories as { name: string }[]).map((c) => c.name).join(", ")
            : null,
          tags: Array.isArray(data.tags)
            ? (data.tags as { name: string }[]).map((t) => t.name).join(", ")
            : null,
          images: JSON.stringify(
            Array.isArray(data.images)
              ? (data.images as { src: string }[]).map((i) => i.src)
              : []
          ),
          parentId: (data.parent_id as number) || null,
          attributes: Array.isArray(data.attributes) && data.attributes.length
            ? data.attributes
            : null,
          metalPurity: null as string | null,
          totalWeight: null as string | null,
          position: (data.menu_order as number) || 0,
        };
        // Extract meta fields if present
        if (Array.isArray(data.meta_data)) {
          for (const m of data.meta_data as { key: string; value: unknown }[]) {
            if (m.key === "_metal_purity" && typeof m.value === "string") row.metalPurity = m.value;
            if (m.key === "_total_weight" && typeof m.value === "string") row.totalWeight = m.value;
          }
        }
        await db
          .insert(products)
          .values(row)
          .onConflictDoUpdate({
            target: products.id,
            set: {
              type: row.type, sku: row.sku, name: row.name, slug: row.slug,
              published: row.published, shortDescription: row.shortDescription,
              description: row.description, regularPrice: row.regularPrice,
              salePrice: row.salePrice, categories: row.categories, tags: row.tags,
              images: row.images, parentId: row.parentId, attributes: row.attributes,
              metalPurity: row.metalPurity, totalWeight: row.totalWeight,
              position: row.position,
            },
          });
      }
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

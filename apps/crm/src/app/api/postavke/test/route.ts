import { NextRequest, NextResponse } from "next/server";
import { getSvePostavke } from "@/lib/settings";
import { fetchGoldPrice } from "@/lib/gold-price";
import { wooDohvatiProizvode } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { servis } = await req.json();
  const postavke = await getSvePostavke();

  try {
    if (servis === "wordpress") {
      if (!postavke.WP_SITE_URL || !postavke.WP_CRM_API_KEY) {
        return NextResponse.json({ ok: false, poruka: "Nedostaje URL ili API ključ" });
      }
      const res = await fetch(
        `${postavke.WP_SITE_URL.replace(/\/$/, "")}/wp-json/jewelry-crm/v1/status`,
        { headers: { Authorization: `Bearer ${postavke.WP_CRM_API_KEY}` } }
      );
      if (!res.ok) {
        return NextResponse.json({
          ok: false,
          poruka: `WP odgovorio sa ${res.status} — provjeri da je plugin aktiviran i ključ tačan`,
        });
      }
      const data = await res.json();
      return NextResponse.json({
        ok: true,
        poruka: `Povezano sa "${data.site}"${data.woocommerce ? " (WooCommerce aktivan)" : " (WooCommerce NIJE aktivan)"}`,
      });
    }

    if (servis === "goldprice") {
      const cijena = await fetchGoldPrice(postavke.GOLDPRICE_API_KEY || undefined);
      return NextResponse.json({
        ok: true,
        poruka: `Trenutna cijena: €${cijena.eurPoUnci.toFixed(2)} / unca`,
      });
    }

    if (servis === "woocommerce") {
      const siteUrl = postavke.WC_SITE_URL || postavke.WP_SITE_URL;
      if (!siteUrl || !postavke.WOOCOMMERCE_CONSUMER_KEY || !postavke.WOOCOMMERCE_CONSUMER_SECRET) {
        return NextResponse.json({ ok: false, poruka: "Nedostaje URL ili ključevi" });
      }
      const proizvodi = await wooDohvatiProizvode(
        {
          siteUrl,
          consumerKey: postavke.WOOCOMMERCE_CONSUMER_KEY,
          consumerSecret: postavke.WOOCOMMERCE_CONSUMER_SECRET,
        },
        3
      );
      return NextResponse.json({
        ok: true,
        poruka: `Povezano — pronađeno ${proizvodi.length} proizvoda u probnom pozivu (npr. "${proizvodi[0]?.name ?? "—"}")`,
      });
    }

    if (servis === "brevo") {
      if (!postavke.BREVO_API_KEY) {
        return NextResponse.json({ ok: false, poruka: "Nedostaje API ključ" });
      }
      const res = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": postavke.BREVO_API_KEY },
      });
      if (!res.ok) {
        return NextResponse.json({ ok: false, poruka: `Brevo odgovorio sa ${res.status} — provjeri ključ` });
      }
      const data = await res.json();
      return NextResponse.json({ ok: true, poruka: `Povezano kao ${data.email}` });
    }

    return NextResponse.json({ ok: false, poruka: "Nepoznat servis" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      poruka: e instanceof Error ? e.message : "Greška u povezivanju",
    });
  }
}

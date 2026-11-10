import { getSvePostavke } from "@/lib/settings";
import KonekcijaKartica from "@/components/KonekcijaKartica";
import WooUvozDugme from "@/components/WooUvozDugme";
import { Database, Check } from "lucide-react";

export const revalidate = 0;

export default async function PostavkePage() {
  const p = await getSvePostavke();

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ink-100">Postavke</h1>
        <p className="text-ink-400 text-sm mt-1">
          Poveži WordPress, cijenu zlata i newsletter — unesi podatke i testiraj
          vezu jednim klikom
        </p>
      </header>

      <div className="rounded-md border border-moss/30 bg-moss/5 shadow-card p-4 mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-moss/10 flex items-center justify-center shrink-0">
          <Database size={15} className="text-moss" />
        </div>
        <div className="text-sm">
          <span className="text-ink-100 font-medium">Baza podataka (Turso)</span>
          <span className="text-ink-400"> — ova stranica se učitala, što znači da je veza aktivna.</span>
        </div>
        <Check size={16} className="text-moss ml-auto shrink-0" />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <KonekcijaKartica
          naziv="WordPress / WooCommerce"
          opis="Za sinkronizaciju proizvoda, narudžbi, kupaca i slanje cijena natrag na sajt"
          servisZaTest="wordpress"
          polja={[
            { kljuc: "WP_SITE_URL", label: "URL sajta (npr. https://tvojazlatara.hr)" },
            { kljuc: "WP_CRM_API_KEY", label: "API ključ (isti kao u WP dodatku)", tip: "password" },
          ]}
          pocetneVrijednosti={{
            WP_SITE_URL: p.WP_SITE_URL,
            WP_CRM_API_KEY: p.WP_CRM_API_KEY,
          }}
        />

        <KonekcijaKartica
          naziv="WooCommerce (izvor podataka)"
          opis="Direktan pristup preko WooCommerce REST API-ja — radi na bilo kom WooCommerce sajtu, bez potrebe za našim dodatkom. Koristi se za uvoz proizvoda, narudžbi i kupaca."
          servisZaTest="woocommerce"
          polja={[
            { kljuc: "WC_SITE_URL", label: "URL sajta (npr. https://tvojazlatara.hr)" },
            { kljuc: "WOOCOMMERCE_CONSUMER_KEY", label: "Consumer key", tip: "password" },
            { kljuc: "WOOCOMMERCE_CONSUMER_SECRET", label: "Consumer secret", tip: "password" },
          ]}
          pocetneVrijednosti={{
            WC_SITE_URL: p.WC_SITE_URL,
            WOOCOMMERCE_CONSUMER_KEY: p.WOOCOMMERCE_CONSUMER_KEY,
            WOOCOMMERCE_CONSUMER_SECRET: p.WOOCOMMERCE_CONSUMER_SECRET,
          }}
          dodatnoIspod={<WooUvozDugme />}
        />

        <KonekcijaKartica
          naziv="Cijena zlata"
          opis="goldprice.dev — radi i bez ključa, ključ samo povećava mjesečni limit"
          servisZaTest="goldprice"
          polja={[{ kljuc: "GOLDPRICE_API_KEY", label: "API ključ (opcionalno)", tip: "password" }]}
          pocetneVrijednosti={{ GOLDPRICE_API_KEY: p.GOLDPRICE_API_KEY }}
        />

        <KonekcijaKartica
          naziv="Newsletter (Brevo)"
          opis="Za slanje najava novih kolekcija pretplaćenim kupcima"
          servisZaTest="brevo"
          polja={[{ kljuc: "BREVO_API_KEY", label: "Brevo API ključ", tip: "password" }]}
          pocetneVrijednosti={{ BREVO_API_KEY: p.BREVO_API_KEY }}
        />
      </div>
    </div>
  );
}

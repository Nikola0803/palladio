import { NextRequest, NextResponse } from "next/server";
import { setPostavka, PostavkaKljuc } from "@/lib/settings";

export const dynamic = "force-dynamic";

const DOZVOLJENI_KLJUCEVI: PostavkaKljuc[] = [
  "WP_SITE_URL",
  "WP_CRM_API_KEY",
  "WOOCOMMERCE_CONSUMER_KEY",
  "WOOCOMMERCE_CONSUMER_SECRET",
  "GOLDPRICE_API_KEY",
  "BREVO_API_KEY",
];

export async function POST(req: NextRequest) {
  const { kljuc, vrijednost } = await req.json();

  if (!DOZVOLJENI_KLJUCEVI.includes(kljuc)) {
    return NextResponse.json({ error: "Nepoznat ključ" }, { status: 400 });
  }

  await setPostavka(kljuc, vrijednost ?? "");
  return NextResponse.json({ ok: true });
}

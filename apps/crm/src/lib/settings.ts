import { db } from "@/lib/db";
import { postavke } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const KEYS = [
  "WP_SITE_URL",
  "WP_CRM_API_KEY",
  "WC_SITE_URL",
  "WOOCOMMERCE_CONSUMER_KEY",
  "WOOCOMMERCE_CONSUMER_SECRET",
  "GOLDPRICE_API_KEY",
  "BREVO_API_KEY",
] as const;

export type PostavkaKljuc = (typeof KEYS)[number];

/** Reads a setting from the DB; falls back to the matching env var. */
export async function getPostavka(kljuc: PostavkaKljuc): Promise<string> {
  const [row] = await db
    .select()
    .from(postavke)
    .where(eq(postavke.kljuc, kljuc))
    .limit(1);
  return row?.vrijednost || process.env[kljuc] || "";
}

export async function getSvePostavke(): Promise<Record<PostavkaKljuc, string>> {
  const rows = await db.select().from(postavke);
  const map = new Map(rows.map((r) => [r.kljuc, r.vrijednost]));
  const rezultat = {} as Record<PostavkaKljuc, string>;
  for (const key of KEYS) {
    rezultat[key] = map.get(key) || process.env[key] || "";
  }
  return rezultat;
}

export async function setPostavka(kljuc: PostavkaKljuc, vrijednost: string) {
  await db
    .insert(postavke)
    .values({ kljuc, vrijednost, azurirano: new Date().toISOString() })
    .onConflictDoUpdate({
      target: postavke.kljuc,
      set: { vrijednost, azurirano: new Date().toISOString() },
    });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cijenaZlataPovijest } from "@/lib/db/schema";
import { fetchGoldPrice } from "@/lib/gold-price";
import { getPostavka } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Protected by the CRM middleware. This is the on-demand counterpart to the
// Vercel cron, useful immediately after entering/changing an API key.
export async function POST() {
  try {
    const price = await fetchGoldPrice((await getPostavka("GOLDPRICE_API_KEY")) || undefined);
    await db.insert(cijenaZlataPovijest).values({
      vrijeme: new Date().toISOString(),
      cijenaEurPoUnci: price.eurPoUnci,
      cijenaEurPoGramu925: price.eurPoGramu925,
      cijenaEurPoGramu750: price.eurPoGramu750,
      cijenaEurPoGramu585: price.eurPoGramu585,
    });
    return NextResponse.json({ ok: true, price });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cijena zlata nije dohvaćena." }, { status: 502 });
  }
}

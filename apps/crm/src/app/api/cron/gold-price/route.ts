import { NextRequest, NextResponse } from "next/server";
import { fetchGoldPrice } from "@/lib/gold-price";
import { db } from "@/lib/db";
import { cijenaZlataPovijest } from "@/lib/db/schema";
import { getPostavka } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Runs on Vercel Cron (see vercel.json). Writes one row per fetch so the
// dashboard reads from the DB — never calls goldprice.dev on page load.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getPostavka("GOLDPRICE_API_KEY");
  const price = await fetchGoldPrice(apiKey || undefined);

  await db.insert(cijenaZlataPovijest).values({
    vrijeme: new Date().toISOString(),
    cijenaEurPoUnci: price.eurPoUnci,
    cijenaEurPoGramu925: price.eurPoGramu925,
    cijenaEurPoGramu750: price.eurPoGramu750,
    cijenaEurPoGramu585: price.eurPoGramu585,
  });

  return NextResponse.json({ ok: true, price });
}

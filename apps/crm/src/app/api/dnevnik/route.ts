import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dnevnikZapisi } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const zapisi = await db
    .select()
    .from(dnevnikZapisi)
    .orderBy(desc(dnevnikZapisi.datum));
  return NextResponse.json({ zapisi });
}

export async function POST(req: NextRequest) {
  const { datum, sadrzaj } = await req.json();

  if (!datum || typeof sadrzaj !== "string") {
    return NextResponse.json({ error: "Nevažeći podaci" }, { status: 400 });
  }

  await db
    .insert(dnevnikZapisi)
    .values({ datum, sadrzaj, azuriran: new Date().toISOString() })
    .onConflictDoUpdate({
      target: dnevnikZapisi.datum,
      set: { sadrzaj, azuriran: new Date().toISOString() },
    });

  return NextResponse.json({ ok: true });
}

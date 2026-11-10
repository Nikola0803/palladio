import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gotoviProizvodi, proizvodMaterijali } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Nedostaje id" }, { status: 400 });

  const [proizvod] = await db
    .select()
    .from(gotoviProizvodi)
    .where(eq(gotoviProizvodi.id, id))
    .limit(1);

  if (!proizvod) {
    return NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 });
  }

  const materijali = await db
    .select()
    .from(proizvodMaterijali)
    .where(eq(proizvodMaterijali.proizvodId, id));

  return NextResponse.json({ proizvod, materijali });
}

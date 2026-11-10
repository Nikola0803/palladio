import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proizvodMaterijali } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { proizvodId, tip, naziv, potrebnaKolicina, jedinica } = await req.json();

  if (!proizvodId || !tip || !naziv || !potrebnaKolicina || !jedinica) {
    return NextResponse.json({ error: "Nedostaju obavezna polja" }, { status: 400 });
  }

  const [stavka] = await db
    .insert(proizvodMaterijali)
    .values({ proizvodId, tip, naziv, potrebnaKolicina, jedinica })
    .returning();

  return NextResponse.json({ ok: true, stavka });
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Nedostaje id" }, { status: 400 });

  await db.delete(proizvodMaterijali).where(eq(proizvodMaterijali.id, id));
  return NextResponse.json({ ok: true });
}

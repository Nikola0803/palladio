import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { affiliatePartneri } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function generisiKod(ime: string) {
  const osnova = ime
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "")
    .slice(0, 6);
  return `${osnova || "PARTNER"}${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function POST(req: NextRequest) {
  const { ime, email, provizijaPosto } = await req.json();

  if (!ime || !email) {
    return NextResponse.json({ error: "Ime i email su obavezni" }, { status: 400 });
  }

  const [partner] = await db
    .insert(affiliatePartneri)
    .values({
      ime,
      email,
      kodZaPracenje: generisiKod(ime),
      provizijaPosto: provizijaPosto ?? 10,
      status: "na_cekanju",
      kreiran: new Date().toISOString(),
    })
    .returning();

  return NextResponse.json({ ok: true, partner });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();

  await db
    .update(affiliatePartneri)
    .set({ status })
    .where(eq(affiliatePartneri.id, id));

  return NextResponse.json({ ok: true });
}

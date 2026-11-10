import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// PATCH /api/payment-links/[id] — ažuriraj status ili podatke
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const allowed = ["status", "kupacIme", "opis", "iznos", "napomena", "heroImage"];
  const update: Record<string, unknown> = { azurirano: new Date() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const [row] = await db
    .update(paymentLinks)
    .set(update)
    .where(eq(paymentLinks.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

// DELETE /api/payment-links/[id] — opozovi (ne briše, postavlja status)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [row] = await db
    .update(paymentLinks)
    .set({ status: "opozvan", azurirano: new Date() })
    .where(eq(paymentLinks.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

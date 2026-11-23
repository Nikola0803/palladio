import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

/**
 * One-off, idempotent migration: add payment_links.kupac_email.
 * Protected by the CRM auth middleware (you must be logged in). Safe to run
 * repeatedly (ADD COLUMN IF NOT EXISTS). Can be removed after it has run once.
 */
export async function GET() {
  try {
    await sql`ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS kupac_email text`;
    return NextResponse.json({ ok: true, message: "kupac_email kolona je dodata (ili je već postojala)." });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "greška" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kupci } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPostavka } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST() {
  const apiKey = await getPostavka("BREVO_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "Brevo API ključ nije podešen" }, { status: 400 });
  }

  const pretplacenici = await db
    .select()
    .from(kupci)
    .where(eq(kupci.prijavljenNaNewsletter, true));

  let uspjesno = 0;
  let neuspjesno = 0;

  for (const k of pretplacenici) {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        email: k.email,
        attributes: { FIRSTNAME: k.ime },
        updateEnabled: true,
      }),
    });
    if (res.ok || res.status === 400) {
      // Brevo returns 400 "contact already exists" — fine with updateEnabled,
      // but some accounts still surface it; treat as success either way.
      uspjesno++;
    } else {
      neuspjesno++;
    }
  }

  return NextResponse.json({ ok: true, uspjesno, neuspjesno, ukupno: pretplacenici.length });
}

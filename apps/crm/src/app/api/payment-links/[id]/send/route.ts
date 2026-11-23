import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { getPostavka } from "@/lib/settings";

export const dynamic = "force-dynamic";

const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL || "https://palladio.hr")
  .replace(/[﻿​ ]/g, "")
  .replace(/\/+$/, "");

function money(iznos: number, valuta: string) {
  try {
    return iznos.toLocaleString("hr-HR", {
      style: "currency",
      currency: (valuta || "EUR").toUpperCase(),
      minimumFractionDigits: 2,
    });
  } catch {
    return `${iznos.toFixed(2)} ${valuta || "EUR"}`;
  }
}

// POST /api/payment-links/[id]/send — email the payment link to the customer
// (+ BCC to the shop). Body may override { email } for the recipient.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const [link] = await db.select().from(paymentLinks).where(eq(paymentLinks.id, id)).limit(1);
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const to = (body.email || link.kupacEmail || "").trim();
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ error: "Nedostaje ispravan email kupca." }, { status: 400 });
  }

  const url = `${WEB_URL}/plati/${link.token}`;
  const iznos = money(link.iznos, link.valuta || "EUR");
  const ime = link.kupacIme ? `Poštovani/a ${link.kupacIme},` : "Poštovani,";
  const opis = link.opis ? `<p style="margin:0 0 16px;color:#555">${escapeHtml(link.opis)}</p>` : "";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h2 style="font-weight:600;margin:0 0 8px">Palladio — zahtjev za plaćanje</h2>
    <p style="margin:0 0 16px;color:#555">${ime}</p>
    ${opis}
    <p style="margin:0 0 4px;color:#555">Iznos za plaćanje:</p>
    <p style="font-size:24px;font-weight:700;margin:0 0 20px">${iznos}</p>
    <a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Plati sada</a>
    <p style="margin:20px 0 0;color:#888;font-size:12px">Ili otvori link: <a href="${url}" style="color:#888">${url}</a></p>
    <p style="margin:24px 0 0;color:#888;font-size:12px">Palladio · <a href="https://palladio.hr" style="color:#888">palladio.hr</a></p>
  </div>`;

  // Copy to the shop (settings EMAIL_BCC, else info@palladio.hr).
  const bccSetting = (await getPostavka("EMAIL_BCC")) || "info@palladio.hr";
  const bcc = bccSetting.split(",").map((s) => s.trim()).filter(Boolean);

  try {
    const result = await sendEmail({
      to,
      bcc,
      subject: `Palladio — zahtjev za plaćanje (${iznos})`,
      html,
      replyTo: "info@palladio.hr",
    });
    // Persist the email we sent to, for the record / resend.
    if (!link.kupacEmail) {
      await db.update(paymentLinks).set({ kupacEmail: to }).where(eq(paymentLinks.id, id));
    }
    return NextResponse.json({ ok: true, to, id: result.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Slanje nije uspjelo" },
      { status: 502 }
    );
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { upiti } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[character] || character));

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "General Inquiry";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const country = typeof body?.country === "string" ? body.country.trim() : "";

  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email) || !message || message.length > 10000) {
    return NextResponse.json({ error: "Popuni obavezna polja ispravnim podacima." }, { status: 400, headers: CORS });
  }

  const name = `${firstName} ${lastName}`;
  await sendEmail({
    to: "info@palladio.hr",
    replyTo: email,
    subject: `[Kontakt] ${subject} — ${name}`,
    html: `<h2>Novi upit sa sajta</h2><p><strong>Predmet:</strong> ${escapeHtml(subject)}</p><p><strong>Ime:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Telefon:</strong> ${escapeHtml(phone || "—")}</p><p><strong>Država:</strong> ${escapeHtml(country || "—")}</p><hr /><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
  });

  await db.insert(upiti).values({
    ime: name,
    email,
    telefon: phone || null,
    poruka: `[${subject}] ${message}`,
    izvor: "kontakt_forma_web",
    kreiran: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true }, { headers: CORS });
}

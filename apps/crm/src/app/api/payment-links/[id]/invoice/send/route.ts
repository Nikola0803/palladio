import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] as string)
  );
}

function formatAmount(amount: number, currency: string | null) {
  return amount.toLocaleString("hr-HR", {
    style: "currency",
    currency: (currency || "EUR").toUpperCase(),
    minimumFractionDigits: 2,
  });
}

// POST /api/payment-links/[id]/invoice/send — email an invoice to the customer.
// A hidden copy is always sent to the shop for its records.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const [link] = await db.select().from(paymentLinks).where(eq(paymentLinks.id, id)).limit(1);
  if (!link) return NextResponse.json({ error: "Payment link nije pronađen." }, { status: 404 });
  const to = String(body.email || link.kupacEmail || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ error: "Unesite ispravan email kupca." }, { status: 400 });
  }

  const invoiceNumber = `PL-${String(link.id).padStart(5, "0")}-${new Date().getFullYear()}`;
  const amount = formatAmount(link.iznos, link.valuta);
  const customerName = link.kupacIme ? ` ${escapeHtml(link.kupacIme)}` : "";
  const description = link.opis ? `<p style="margin:0 0 16px;color:#555">${escapeHtml(link.opis)}</p>` : "";
  const invoiceDate = (link.placenoAt || new Date()).toLocaleDateString("hr-HR");
  const dateLabel = link.placenoAt ? "Datum plaćanja" : "Datum izdavanja";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#171717">
      <h2 style="margin:0 0 16px;font-weight:600">Palladio — faktura ${invoiceNumber}</h2>
      <p style="margin:0 0 16px">Poštovani/a${customerName},</p>
      <p style="margin:0 0 16px;color:#555">U nastavku je sažetak vaše fakture.</p>
      ${description}
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
        <tr><td style="padding:10px 0;border-bottom:1px solid #e5e5e5;color:#666">Broj fakture</td><td style="padding:10px 0;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600">${invoiceNumber}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #e5e5e5;color:#666">${dateLabel}</td><td style="padding:10px 0;border-bottom:1px solid #e5e5e5;text-align:right">${invoiceDate}</td></tr>
        <tr><td style="padding:12px 0;font-weight:700">Ukupno</td><td style="padding:12px 0;text-align:right;font-size:18px;font-weight:700">${amount}</td></tr>
      </table>
      <p style="margin:24px 0 0;color:#888;font-size:12px">Palladio · <a href="https://palladio.hr" style="color:#888">palladio.hr</a></p>
    </div>`;

  try {
    const result = await sendEmail({
      to,
      // Keep the shop's copy private from the customer.
      bcc: ["info@palladio.hr"],
      subject: `Palladio — faktura ${invoiceNumber}`,
      html,
      replyTo: "info@palladio.hr",
      attachments: [{
        filename: `faktura-${invoiceNumber}.html`,
        content: Buffer.from(html).toString("base64"),
      }],
    });
    if (!link.kupacEmail) {
      await db.update(paymentLinks).set({ kupacEmail: to }).where(eq(paymentLinks.id, id));
    }
    return NextResponse.json({ ok: true, to, id: result.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Slanje fakture nije uspjelo." },
      { status: 502 }
    );
  }
}

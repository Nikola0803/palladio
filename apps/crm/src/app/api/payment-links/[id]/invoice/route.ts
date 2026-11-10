import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentLinks, kupci } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/payment-links/[id]/invoice — vraća HTML fakturu
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) return new NextResponse("Invalid id", { status: 400 });

  const [row] = await db
    .select({
      id: paymentLinks.id,
      token: paymentLinks.token,
      kupacIme: paymentLinks.kupacIme,
      opis: paymentLinks.opis,
      iznos: paymentLinks.iznos,
      valuta: paymentLinks.valuta,
      napomena: paymentLinks.napomena,
      kreirano: paymentLinks.kreirano,
      kupacEmail: kupci.email,
      kupacImeDb: kupci.ime,
    })
    .from(paymentLinks)
    .leftJoin(kupci, eq(paymentLinks.kupacId, kupci.id))
    .where(eq(paymentLinks.id, id));

  if (!row) return new NextResponse("Payment link nije pronađen.", { status: 404 });

  const invoiceNum = `PL-${String(row.id).padStart(5, "0")}-${new Date().getFullYear()}`;
  const dateStr = row.kreirano
    ? new Date(row.kreirano).toLocaleDateString("hr-HR")
    : new Date().toLocaleDateString("hr-HR");
  const kupacIme = row.kupacIme || row.kupacImeDb || "N/A";
  const kupacEmail = row.kupacEmail || "";
  const totalEur = Number(row.iznos).toLocaleString("hr-HR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Parsiraj stavke iz opis polja
  const rawItems = (row.opis || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="hr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Faktura ${invoiceNum}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a1a;background:#f5f5f5;padding:20px}
  .page{max-width:800px;margin:0 auto;background:#fff;padding:48px 56px;box-shadow:0 2px 16px rgba(0,0,0,.08)}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid #1a1a1a}
  .brand{font-size:22px;font-weight:700;letter-spacing:1px}
  .brand small{display:block;font-size:11px;font-weight:400;color:#666;margin-top:3px}
  .invoice-meta{text-align:right}
  .invoice-meta h1{font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#666;margin-bottom:6px}
  .invoice-meta .num{font-size:18px;font-weight:700}
  .invoice-meta .date{font-size:12px;color:#666;margin-top:4px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:36px}
  .party h3{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:8px}
  .party p{line-height:1.7;color:#333}
  table{width:100%;border-collapse:collapse;margin-bottom:28px}
  thead th{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:600;padding:8px 10px;border-bottom:1px solid #e5e5e5;text-align:left}
  tbody td{padding:11px 10px;border-bottom:1px solid #f0f0f0;font-size:13px}
  tbody tr:last-child td{border-bottom:none}
  .totals{display:flex;justify-content:flex-end;margin-bottom:36px}
  .totals-box{min-width:260px}
  .totals-row{display:flex;justify-content:space-between;padding:6px 0}
  .totals-row.final{border-top:2px solid #1a1a1a;margin-top:4px;padding-top:10px;font-weight:700;font-size:15px}
  .footer{text-align:center;font-size:11px;color:#aaa;padding-top:24px;border-top:1px solid #e5e5e5}
  .print-btn{position:fixed;top:20px;right:20px;background:#1a1a1a;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:13px;cursor:pointer}
  @media print{.print-btn{display:none}body{background:#fff;padding:0}.page{box-shadow:none;padding:32px 40px}}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">🖨 Isprintaj / Spremi PDF</button>
<div class="page">
  <div class="header">
    <div class="brand">PALLADIO<small>palladio.hr · Zlatarna &amp; CAD Design</small></div>
    <div class="invoice-meta">
      <h1>Faktura</h1>
      <div class="num">${invoiceNum}</div>
      <div class="date">Datum: ${dateStr}</div>
    </div>
  </div>
  <div class="parties">
    <div class="party">
      <h3>Prodavač</h3>
      <p><strong>Palladio d.o.o.</strong><br>palladio.hr<br>Hrvatska</p>
    </div>
    <div class="party">
      <h3>Kupac</h3>
      <p><strong>${kupacIme}</strong>${kupacEmail ? `<br>${kupacEmail}` : ""}${row.napomena ? `<br><em>${row.napomena}</em>` : ""}</p>
    </div>
  </div>
  <table>
    <thead><tr><th style="width:50px">#</th><th>Opis stavke</th></tr></thead>
    <tbody>
      ${rawItems.map((item, i) => `<tr><td style="color:#999">${i + 1}</td><td>${item}</td></tr>`).join("")}
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-box">
      <div class="totals-row final">
        <span>Ukupno za naplatu</span>
        <span>${totalEur} €</span>
      </div>
    </div>
  </div>
  <div class="footer">
    Ovaj dokument generiran je automatski iz sustava palladio.hr · ${invoiceNum} · ${dateStr}
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  });
}

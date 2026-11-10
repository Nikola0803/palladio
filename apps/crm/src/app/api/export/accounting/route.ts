import { NextResponse } from "next/server";
import { generateAccountingWorkbook } from "@/lib/accounting-export";

export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = await generateAccountingWorkbook();
  const datum = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Evidencija_zaliha_nakit_${datum}.xlsx"`,
    },
  });
}

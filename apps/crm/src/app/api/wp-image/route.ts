import { NextRequest, NextResponse } from "next/server";
import { readLegacyUpload } from "@/lib/legacy-media";

export const dynamic = "force-dynamic";

/**
 * Image proxy for media still hosted on the Hostinger/crohost server.
 * It connects directly to the original virtual host, so it keeps working after
 * palladio.hr itself points at Vercel.
 *
 * Usage: GET /api/wp-image?path=2026/10/image.jpg
 */
const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET(req: NextRequest) {
  const rawPath = req.nextUrl.searchParams.get("path") || "";
  if (!rawPath || rawPath.includes("..")) {
    return new NextResponse(null, { status: 400, headers: CORS });
  }

  try {
    const upstream = await readLegacyUpload(rawPath);
    if (upstream.status < 200 || upstream.status >= 300) {
      return new NextResponse(null, { status: upstream.status, headers: CORS });
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        ...CORS,
        "Content-Type": upstream.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502, headers: CORS });
  }
}

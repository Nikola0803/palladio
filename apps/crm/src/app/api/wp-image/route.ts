import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Image proxy for WordPress media still hosted on the Hostinger/crohost server
 * (91.234.46.99). We connect to the origin by IP and send Host: palladio.hr,
 * so it keeps working no matter where the palladio.hr DNS points (the apex now
 * resolves to Vercel, so the storefront can no longer load /wp-content directly).
 *
 * Usage: GET /api/wp-image?path=2026/10/image.jpg
 */
const HOSTINGER_IP = "91.234.46.99";
const WORDPRESS_HOST = "palladio.hr";

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET(req: NextRequest) {
  const rawPath = req.nextUrl.searchParams.get("path") || "";
  if (!rawPath || rawPath.includes("..")) {
    return new NextResponse(null, { status: 400, headers: CORS });
  }

  const url = `http://${HOSTINGER_IP}/wp-content/uploads/${rawPath}`;
  try {
    const upstream = await fetch(url, {
      headers: { Host: WORDPRESS_HOST },
      cache: "no-store",
    });
    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status, headers: CORS });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        ...CORS,
        "Content-Type": upstream.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502, headers: CORS });
  }
}

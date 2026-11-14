import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) return null;
  return new TextEncoder().encode(s);
}

// Routes that do NOT require authentication
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/stripe/",
  "/api/stripe/intent",
  "/api/stripe/cart-intent",
  "/api/stripe/webhook",
  "/api/products",
  "/api/catalog/",
  "/api/blog/",
  "/plati/",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p));
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS });
  }

  // Add CORS headers to all API responses
  if (pathname.startsWith("/api/")) {
    const res = NextResponse.next();
    for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);

    // Public API routes pass through
    if (isPublic(pathname)) return res;

    // Verify session for protected API routes
    const token = req.cookies.get("crm_session")?.value;
    const secret = getSecret();
    if (!token || !secret) {
      return NextResponse.json({ error: "Nije prijavljeno" }, { status: 401 });
    }

    try {
      await jwtVerify(token, secret);
      return res;
    } catch {
      return NextResponse.json({ error: "Sesija istekla" }, { status: 401 });
    }
  }

  // Public page routes pass through
  if (isPublic(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Protect all other pages
  const token = req.cookies.get("crm_session")?.value;
  const secret = getSecret();

  if (!token || !secret) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { NextRequest, NextResponse } from "next/server";

/**
 * HTTP Basic Auth za CRM.
 * Izuzeto: /plati/* (javne payment link stranice — kupci ne trebaju login)
 *           /api/stripe/* (Stripe intent pozivi iz /plati stranica)
 *
 * Configure via Vercel env vars: APP_USERNAME / APP_PASSWORD.
 * Ako je neko od toga prazno, auth se preskače (ne lockout).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Javne rute — bez autentikacije
  if (
    pathname.startsWith("/plati") ||
    pathname.startsWith("/api/stripe/")
  ) {
    return NextResponse.next();
  }

  const user = process.env.APP_USERNAME;
  const pass = process.env.APP_PASSWORD;

  if (!user || !pass) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");

  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const separatorIndex = decoded.indexOf(":");
    const suppliedUser = decoded.slice(0, separatorIndex);
    const suppliedPass = decoded.slice(separatorIndex + 1);

    if (suppliedUser === user && suppliedPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Potrebna je prijava.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Palladio CRM"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("crm_session")?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        ime: payload.ime,
        uloga: payload.uloga,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

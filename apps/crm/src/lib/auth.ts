import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) return null;
  return new TextEncoder().encode(s);
}

export async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get("crm_session")?.value;
  const secret = getSecret();
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; email: string; uloga: string; ime: string };
  } catch {
    return null;
  }
}

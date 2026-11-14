import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { crmUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email i lozinka su obavezni" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(crmUsers)
      .where(eq(crmUsers.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user || !user.aktivan) {
      return NextResponse.json({ error: "Pogrešan email ili lozinka" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Pogrešan email ili lozinka" }, { status: 401 });
    }

    // Update last login
    await db
      .update(crmUsers)
      .set({ zadnjiLogin: new Date() })
      .where(eq(crmUsers.id, user.id));

    const token = await new SignJWT({
      sub: String(user.id),
      email: user.email,
      uloga: user.uloga,
      ime: user.ime ?? "",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getSecret());

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, ime: user.ime, uloga: user.uloga },
    });

    res.cookies.set("crm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Greška servera" }, { status: 500 });
  }
}

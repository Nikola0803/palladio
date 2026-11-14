/**
 * Seed script — runs during Vercel build.
 * Uses the same @vercel/postgres sql client the CRM app uses.
 * Idempotent: skips if admin already exists.
 */
import bcrypt from "bcryptjs";
import { sql } from "@vercel/postgres";

if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  console.log("[seed] No POSTGRES_URL — skipping seed");
  process.exit(0);
}

try {
  await sql`
    CREATE TABLE IF NOT EXISTS crm_users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      ime TEXT,
      uloga TEXT NOT NULL DEFAULT 'admin',
      aktivan BOOLEAN NOT NULL DEFAULT true,
      kreiran TIMESTAMP DEFAULT NOW(),
      zadnji_login TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT,
      featured_image TEXT,
      author_name TEXT DEFAULT 'Palladio',
      published BOOLEAN NOT NULL DEFAULT false,
      published_at TIMESTAMP,
      kreirano TIMESTAMP DEFAULT NOW(),
      azurirano TIMESTAMP DEFAULT NOW()
    )
  `;

  const existing = await sql`
    SELECT id FROM crm_users WHERE email = 'admin@palladio.hr' LIMIT 1
  `;

  if (existing.rows.length > 0) {
    console.log("[seed] Admin already exists — skipping");
    process.exit(0);
  }

  const password = process.env.ADMIN_PASSWORD || "Palladio2024!";
  const hash = await bcrypt.hash(password, 10);

  await sql`
    INSERT INTO crm_users (email, password_hash, ime, uloga, aktivan)
    VALUES ('admin@palladio.hr', ${hash}, 'Admin', 'admin', true)
    ON CONFLICT (email) DO NOTHING
  `;

  console.log("[seed] Admin created: admin@palladio.hr");
} catch (err) {
  console.error("[seed] Error:", err.message);
}

// @vercel/postgres keeps the WebSocket connection open — force exit so the
// build command doesn't hang waiting for the event loop to drain.
process.exit(0);

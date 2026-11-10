import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

/**
 * Vercel Postgres (Neon) — drizzle ORM
 * POSTGRES_URL se automatski injektira kad povezeš Vercel Postgres storage
 * u Vercel dashboardu (Storage tab). Ne treba ručno postavljati.
 */
export const db = drizzle(sql, { schema });

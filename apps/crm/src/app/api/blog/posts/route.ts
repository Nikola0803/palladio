import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function mapPost(r: typeof blogPosts.$inferSelect, withContent = false) {
  return {
    id: r.id,
    slug: r.slug,
    date: (r.publishedAt || r.kreirano)?.toISOString() ?? new Date().toISOString(),
    title: r.title,
    excerpt: r.excerpt || "",
    content: withContent ? (r.content || "") : undefined,
    featuredImage: r.featuredImage,
    authorName: r.authorName,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
      .limit(1);
    return NextResponse.json(post ? mapPost(post, true) : null, { headers: CORS });
  }

  const perPage = Math.min(parseInt(searchParams.get("per_page") || "12"), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);

  // Authenticated users (CRM admin) see drafts too
  const user = await getSessionUser(req);
  const where = user ? undefined : eq(blogPosts.published, true);

  const rows = await db
    .select()
    .from(blogPosts)
    .where(where)
    .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.kreirano))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return NextResponse.json(rows.map((r) => mapPost(r)), { headers: CORS });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Nije prijavljeno" }, { status: 401 });

  const body = await req.json();
  const isPublished = Boolean(body.published);

  const [post] = await db
    .insert(blogPosts)
    .values({
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt || null,
      content: body.content || null,
      featuredImage: body.featuredImage || null,
      authorName: body.authorName || "Palladio",
      published: isPublished,
      publishedAt: isPublished ? new Date() : null,
    })
    .returning();

  return NextResponse.json(post, { headers: CORS });
}

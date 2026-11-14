import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Nije prijavljeno" }, { status: 401 });

  const id = parseInt(params.id);
  const body = await req.json();
  const isPublished = Boolean(body.published);

  const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  const wasPublished = existing[0]?.published;

  const [post] = await db
    .update(blogPosts)
    .set({
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt || null,
      content: body.content || null,
      featuredImage: body.featuredImage || null,
      authorName: body.authorName || "Palladio",
      published: isPublished,
      publishedAt: isPublished && !wasPublished ? new Date() : existing[0]?.publishedAt,
      azurirano: new Date(),
    })
    .where(eq(blogPosts.id, id))
    .returning();

  return NextResponse.json(post, { headers: CORS });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Nije prijavljeno" }, { status: 401 });

  const id = parseInt(params.id);
  await db.delete(blogPosts).where(eq(blogPosts.id, id));

  return NextResponse.json({ ok: true }, { headers: CORS });
}

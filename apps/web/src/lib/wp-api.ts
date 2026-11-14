import type { BlogPost } from "../types/blog";
import { cachedJson } from "./fetch-cache";

const CRM_URL = (import.meta.env.VITE_CRM_URL || "").replace(/^﻿/, "").replace(/\/+$/, "");
const BLOG_BASE = `${CRM_URL}/api/blog`;

function crmFetch<T = unknown>(path: string): Promise<T> {
  const url = `${BLOG_BASE}${path}`;
  return cachedJson<T>(url, {}, (status) =>
    new Error(`Palladio blog API error ${status} on ${url}. Check VITE_CRM_URL is set correctly.`)
  );
}

function mapPost(r: Record<string, unknown>, withContent = false): BlogPost {
  return {
    id: r.id as number,
    slug: r.slug as string,
    date: r.date as string,
    title: r.title as string,
    excerpt: (r.excerpt as string) || "",
    content: withContent ? (r.content as string) || "" : undefined,
    featuredImage: (r.featuredImage as string | null) ?? null,
    authorName: (r.authorName as string | null) ?? null,
  };
}

export async function getBlogPosts(opts: { perPage?: number; page?: number } = {}): Promise<BlogPost[]> {
  const params = new URLSearchParams();
  if (opts.perPage) params.set("per_page", String(opts.perPage));
  if (opts.page) params.set("page", String(opts.page));
  const raw = await crmFetch<Record<string, unknown>[]>(`/posts?${params.toString()}`);
  return (raw || []).map((r) => mapPost(r));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const raw = await crmFetch<Record<string, unknown> | null>(
    `/posts?slug=${encodeURIComponent(slug)}`
  );
  if (!raw) return null;
  return mapPost(raw, true);
}

export async function getPageBySlug(_slug: string): Promise<{ title: string; content: string } | null> {
  return null;
}

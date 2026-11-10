import type { BlogPost } from "../types/blog";
import { cachedJson } from "./fetch-cache";

/**
 * Client for WordPress core's own public REST API (`wp/v2`) — used only for
 * blog posts. Unlike the WooCommerce catalog, this doesn't need a custom
 * bridge plugin: `wp/v2/posts` is public and unauthenticated out of the
 * box on any standard WordPress install, so this reads real posts straight
 * from wp-admin with no extra backend work.
 *
 * GET requests are deduplicated in-flight and cached for 5 minutes.
 */
const WP_URL = (import.meta.env.VITE_WP_URL || "").replace(/\/+$/, "");
const WP_API_BASE = `${WP_URL}/wp-json/wp/v2`;
const HEADERS = { Accept: "application/json" } as const;

interface RawWpPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content?: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string }>;
    author?: Array<{ name?: string }>;
  };
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

function mapPost(raw: RawWpPost, withContent = false): BlogPost {
  return {
    id: raw.id,
    slug: raw.slug,
    date: raw.date,
    title: stripHtml(raw.title.rendered),
    excerpt: stripHtml(raw.excerpt.rendered),
    content: withContent ? raw.content?.rendered : undefined,
    featuredImage: raw._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null,
    authorName: raw._embedded?.author?.[0]?.name || null,
  };
}

function wpFetch<T = unknown>(path: string): Promise<T> {
  const url = `${WP_API_BASE}${path}`;
  return cachedJson<T>(url, { headers: HEADERS }, (status) =>
    new Error(
      `WordPress API error ${status} on ${url}. Confirm the site's own REST API (wp/v2) is reachable ` +
        `and that no security plugin is blocking /wp-json/wp/v2/posts.`
    )
  );
}

export async function getBlogPosts(opts: { perPage?: number; page?: number } = {}): Promise<BlogPost[]> {
  const params = new URLSearchParams({ _embed: "1" });
  if (opts.perPage) params.set("per_page", String(opts.perPage));
  if (opts.page) params.set("page", String(opts.page));
  const raw = (await wpFetch(`/posts?${params.toString()}`)) as RawWpPost[];
  return raw.map((p) => mapPost(p));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const raw = (await wpFetch(`/posts?slug=${encodeURIComponent(slug)}&_embed=1`)) as RawWpPost[];
  if (!raw.length) return null;
  return mapPost(raw[0], true);
}

export async function getPageBySlug(slug: string): Promise<{ title: string; content: string } | null> {
  const raw = (await wpFetch(`/pages?slug=${encodeURIComponent(slug)}`)) as RawWpPost[];
  if (!raw.length) return null;
  return { title: stripHtml(raw[0].title.rendered), content: raw[0].content?.rendered || "" };
}

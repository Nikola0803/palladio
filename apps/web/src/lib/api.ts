import type { Category, Product, ProductListResponse } from "../types/catalog";
import { cachedJson } from "./fetch-cache";

/**
 * Client for the public `palladio/v1` REST namespace exposed by the
 * Palladio CMS Bridge WordPress plugin. No API keys required — that plugin
 * proxies WooCommerce server-side and only ever returns public catalog
 * data, so this is safe to call directly from the browser.
 *
 * VITE_WP_URL defaults to same-origin ("") — correct once this app is
 * deployed through the Palladio Frontend Loader plugin's SPA takeover,
 * since the app is then served BY the same WordPress site it's fetching
 * from. Set it in .env.local only for local dev against the live site.
 *
 * All GET requests are deduplicated in-flight and cached for 5 minutes so
 * concurrent callers (Header + page component both loading categories) share
 * a single network round-trip, and back-navigations return instantly.
 */
// Strip any trailing slash so we never build a double-slash URL
// (https://site.com//wp-json/...) if VITE_WP_URL was set with one — some
// hosts/WAFs 404 on that even though the route genuinely exists.
const WP_URL = (import.meta.env.VITE_WP_URL || "").replace(/\/+$/, "");
const API_BASE = `${WP_URL}/wp-json/palladio/v1`;
const HEADERS = { Accept: "application/json" } as const;

function apiFetch<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  return cachedJson<T>(url, { headers: HEADERS }, (status) =>
    new Error(
      `Palladio API error ${status} on ${url}. If this is a 404, check WP Admin > Settings > ` +
        `Permalinks isn't set to "Plain" (custom REST routes need pretty permalinks) — open the ` +
        `Permalinks page and click Save to flush rewrite rules, then also confirm the Palladio CMS ` +
        `Bridge plugin is active. You can test the route directly by visiting it in a browser.`
    )
  );
}

export function getCategories(opts: { parentOnly?: boolean } = {}): Promise<Category[]> {
  const qs = opts.parentOnly ? "?parent_only=1" : "";
  return apiFetch<Category[]>(`/categories${qs}`);
}

export function getProducts(
  opts: { category?: string; perPage?: number; page?: number; random?: boolean; search?: string } = {}
): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  if (opts.perPage) params.set("per_page", String(opts.perPage));
  if (opts.page) params.set("page", String(opts.page));
  if (opts.random) params.set("random", "1");
  if (opts.search) params.set("search", opts.search);
  const qs = params.toString();
  return apiFetch<ProductListResponse>(`/products${qs ? `?${qs}` : ""}`);
}

export function getProductBySlug(slug: string): Promise<Product> {
  return apiFetch<Product>(`/products/${encodeURIComponent(slug)}`);
}

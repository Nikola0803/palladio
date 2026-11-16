import type { Category, Product, ProductListResponse } from "../types/catalog";
import { cachedJson } from "./fetch-cache";
import { proxied } from "./images";
import { cleanUrl } from "./env";

// Route every catalog image through the same-origin proxy so it stays
// independent of the palladio.hr DNS (see images.ts / api/wp-image.js).
const normProduct = (p: Product): Product => ({
  ...p,
  images: (p.images || []).map((im) => ({ ...im, src: proxied(im.src) })),
});

/**
 * Catalog client — now backed by the Palladio CRM (Neon DB) instead of WordPress.
 * VITE_CRM_URL must be set (e.g. https://palladio-crm.vercel.app).
 */
const CRM_URL = cleanUrl(import.meta.env.VITE_CRM_URL);
const API_BASE = `${CRM_URL}/api`;
const HEADERS = { Accept: "application/json" } as const;

function apiFetch<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  return cachedJson<T>(url, { headers: HEADERS }, (status) =>
    new Error(
      `Palladio catalog API error ${status} on ${url}. Check VITE_CRM_URL is set correctly.`
    )
  );
}

// ----- Categories -----

export function getCategories(opts: { parentOnly?: boolean } = {}): Promise<Category[]> {
  const qs = opts.parentOnly ? "?parent_only=1" : "";
  return apiFetch<Category[]>(`/catalog/categories${qs}`).then((cats) =>
    cats.map((c) => ({ ...c, image: c.image ? proxied(c.image) : c.image }))
  );
}

// ----- Products -----

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
  return apiFetch<ProductListResponse>(`/catalog/products${qs ? `?${qs}` : ""}`).then((r) => ({
    ...r,
    items: (r.items || []).map(normProduct),
  }));
}

export function getProductBySlug(slug: string): Promise<Product> {
  return apiFetch<Product>(`/catalog/products/${encodeURIComponent(slug)}`).then(normProduct);
}

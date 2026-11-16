// WooCommerce serves "-1024x1024" style thumbnails; drop the suffix for the original.
export const fullSize = (url?: string | null) => url?.replace(/-\d+x\d+(?=\.\w+$)/, "");

const WP_ORIGIN = "https://palladio.hr";

/**
 * Normalize a product/media image URL. The catalog stores absolute
 * palladio.hr upload URLs, and palladio.hr currently serves WordPress on the
 * host, so the images load directly from there. We only strip a leading BOM /
 * zero-width char and force any relative /wp-content/uploads path back to the
 * absolute WordPress origin (the in-app proxy is not served under the services
 * umbrella). Non-WP URLs pass through cleaned.
 */
export const proxied = (url?: string | null): string => {
  if (!url) return "";
  const clean = url.replace(/[﻿​ ]/g, "").trim();
  if (clean.startsWith("/wp-content/uploads/")) return `${WP_ORIGIN}${clean}`;
  const m = clean.match(/^\/api\/wp-image\?path=(.+)$/);
  if (m) return `${WP_ORIGIN}/wp-content/uploads/${decodeURIComponent(m[1])}`;
  return clean;
};

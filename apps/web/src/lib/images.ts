// WooCommerce serves "-1024x1024" style thumbnails; drop the suffix for the original.
export const fullSize = (url?: string | null) => url?.replace(/-\d+x\d+(?=\.\w+$)/, "");

/**
 * Rewrite a WordPress media URL to this site's own image proxy
 * (apps/web/api/wp-image.js), which fetches from the Hostinger origin by IP —
 * so images keep working regardless of where the palladio.hr DNS points, and
 * without depending on a path rewrite firing. Also strips a leading BOM /
 * zero-width char that has crept into some env values. Non-WP URLs pass through
 * (minus any BOM).
 */
export const proxied = (url?: string | null): string => {
  if (!url) return "";
  const clean = url.replace(/^﻿/, "").trim();
  const m = clean.match(/\/wp-content\/uploads\/(.+)$/i);
  return m ? `/api/wp-image?path=${m[1]}` : clean;
};

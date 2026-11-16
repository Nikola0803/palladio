// WooCommerce serves "-1024x1024" style thumbnails; drop the suffix for the original.
export const fullSize = (url?: string | null) => url?.replace(/-\d+x\d+(?=\.\w+$)/, "");

/**
 * Rewrite absolute WordPress media URLs (palladio.hr / www.palladio.hr) to a
 * RELATIVE /wp-content/uploads/... path. Relative paths are served by this
 * site's own image proxy (apps/web/api/wp-image.js), which fetches from the
 * Hostinger origin by IP — so images keep working regardless of where the
 * palladio.hr DNS points. Non-WordPress and already-relative URLs pass through.
 */
export const proxied = (url?: string | null): string => {
  if (!url) return "";
  return url.replace(/^https?:\/\/(?:www\.)?palladio\.hr(?=\/wp-content\/uploads\/)/i, "");
};

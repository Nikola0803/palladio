import { crmUrl } from "./env";

// WooCommerce serves "-1024x1024" style thumbnails; drop the suffix for the original.
export const fullSize = (url?: string | null) => url?.replace(/-\d+x\d+(?=\.\w+$)/, "");

// WordPress media lives on the Hostinger origin. Serve it through the CRM's
// image proxy (crm.palladio.hr/api/wp-image), which fetches the Hostinger IP
// server-side — so images work regardless of where palladio.hr DNS points.
const CRM = crmUrl(import.meta.env.VITE_CRM_URL);

export const wpImage = (pathInUploads: string) =>
  `${CRM}/api/wp-image?path=${pathInUploads.replace(/^\/+/, "")}`;

/**
 * Rewrite a product/media image URL to the CRM image proxy. Strips a leading
 * BOM/zero-width char. Absolute palladio.hr upload URLs and relative
 * /wp-content/uploads paths both map to the proxy; anything else passes through.
 */
export const proxied = (url?: string | null): string => {
  if (!url) return "";
  const clean = url.replace(/[﻿​ ]/g, "").trim();
  const m = clean.match(/\/wp-content\/uploads\/(.+)$/i);
  if (m) return wpImage(m[1]);
  const q = clean.match(/[?&]path=([^&]+)$/); // already-proxied form
  if (q && /\/api\/wp-image/.test(clean)) return wpImage(decodeURIComponent(q[1]));
  return clean;
};

// Env values pasted into the Vercel dashboard sometimes carry an invisible
// leading BOM / zero-width / non-breaking space. Left in a URL it turns
// "https://x" into an invalid string (seen as "%EF%BB%BFhttps:/..."), so fetch
// fails and links break. Sanitize every env-derived URL through this.
export const cleanUrl = (v?: string | null): string =>
  (v || "")
    .replace(/[﻿​ ]/g, "")
    .trim()
    .replace(/\/+$/, "");

// The CRM (catalog / blog / PaymentIntent) is a separate Vercel app, reached
// cross-origin. Set VITE_CRM_URL to its real, reachable domain. If it is unset
// we fall back to the project's default Vercel domain.
const CRM_FALLBACK = "https://crm.palladio.hr";
export const crmUrl = (v?: string | null): string => cleanUrl(v) || CRM_FALLBACK;

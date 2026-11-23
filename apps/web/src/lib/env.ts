// Env values pasted into the Vercel dashboard sometimes carry an invisible
// leading BOM / zero-width / non-breaking space. Left in a URL it turns
// "https://x" into an invalid string (seen as "%EF%BB%BFhttps:/..."), so fetch
// fails and links break. Sanitize every env-derived URL through this.
export const cleanUrl = (v?: string | null): string => {
  const url = (v || "")
    .replace(/[﻿​ ]/g, "")
    .trim()
    .replace(/\/+$/, "");
  // The apex domain redirects to www. Store API POST/OPTIONS requests cannot
  // follow that redirect under CORS, so always call the canonical origin.
  return url === "https://palladio.hr" ? "https://www.palladio.hr" : url;
};

// The CRM (catalog / blog / PaymentIntent) is a separate Vercel app, reached
// cross-origin. Set VITE_CRM_URL to its real, reachable domain. If it is unset
// we fall back to the project's default Vercel domain.
const CRM_FALLBACK = "https://crm.palladio.hr";
// `palladio-crm.vercel.app` is an old deployment that still serves catalog
// data but no longer serves the Hostinger image proxy. Some older Vercel
// environment settings contain it, so route those builds to the live custom
// CRM domain instead.
const LEGACY_CRM_URL = "https://palladio-crm.vercel.app";
export const crmUrl = (v?: string | null): string => {
  const configured = cleanUrl(v);
  return !configured || configured === LEGACY_CRM_URL ? CRM_FALLBACK : configured;
};

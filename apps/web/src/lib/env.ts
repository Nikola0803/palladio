// Env values pasted into the Vercel dashboard sometimes carry an invisible
// leading BOM / zero-width / non-breaking space. Left in a URL it turns
// "https://x" into an invalid string (seen as "%EF%BB%BFhttps:/..."), so fetch
// fails and links break. Sanitize every env-derived URL through this.
export const cleanUrl = (v?: string | null): string =>
  (v || "")
    .replace(/[﻿​ ]/g, "")
    .trim()
    .replace(/\/+$/, "");

// The CRM (catalog / blog / PaymentIntent) is a Vercel app. Its stable Vercel
// domain works regardless of where the palladio.hr DNS points. palladio.hr
// itself is the WordPress/WooCommerce host and does NOT serve the CRM API, so
// if the env is empty or still points there, fall back to the Vercel CRM.
const CRM_FALLBACK = "https://palladio-crm.vercel.app";
export const crmUrl = (v?: string | null): string => {
  const c = cleanUrl(v);
  if (!c || /(^|\/\/)(www\.)?palladio\.hr/i.test(c)) return CRM_FALLBACK;
  return c;
};

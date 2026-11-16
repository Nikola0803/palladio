// Env values pasted into the Vercel dashboard sometimes carry an invisible
// leading BOM / zero-width / non-breaking space. Left in a URL it turns
// "https://x" into an invalid string (seen as "%EF%BB%BFhttps:/..."), so fetch
// fails and links break. Sanitize every env-derived URL through this.
export const cleanUrl = (v?: string | null): string =>
  (v || "")
    .replace(/[﻿​ ]/g, "")
    .trim()
    .replace(/\/+$/, "");

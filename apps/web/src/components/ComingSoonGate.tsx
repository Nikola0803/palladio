import { useState, type FormEvent, type ReactNode } from "react";
import PalladioLogo from "./ui/PalladioLogo";

/**
 * Simple client-side "coming soon" gate for pre-launch. Not real security —
 * this is a static SPA, so the password check happens in the browser and
 * anyone reading the JS bundle can see it. It's meant to keep casual
 * visitors out while you (the owner) iterate on design, not to protect
 * anything sensitive. For that reason, set VITE_SITE_ACCESS_PASSWORD to
 * something you don't reuse anywhere else.
 *
 * Once the right password is entered, access is remembered in this
 * browser's localStorage (key below) so you don't have to re-enter it on
 * every visit — clear it (or use a different browser/incognito window) to
 * see the gate again.
 */
const ACCESS_STORAGE_KEY = "palladio_site_access_granted";
const SITE_PASSWORD = import.meta.env.VITE_SITE_ACCESS_PASSWORD || "";

function hasAccess() {
  try {
    return localStorage.getItem(ACCESS_STORAGE_KEY) === "granted";
  } catch {
    // localStorage unavailable (e.g. blocked cookies) — fail closed, show gate.
    return false;
  }
}

export default function ComingSoonGate({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(hasAccess);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!SITE_PASSWORD) {
      // No password configured yet — fail closed rather than silently
      // letting everyone in, but say so plainly instead of a generic error.
      setError(true);
      return;
    }
    if (password === SITE_PASSWORD) {
      try {
        localStorage.setItem(ACCESS_STORAGE_KEY, "granted");
      } catch {
        // Ignore — access still works for this page load even if it can't persist.
      }
      setGranted(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (granted) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-palladio-offwhite px-6">
      <div className="w-full max-w-sm text-center">
        <div className="h-9 mx-auto mb-10 flex justify-center">
          <PalladioLogo className="h-full" />
        </div>

        <p className="tracked-label text-palladio-grey mb-3">Coming Soon</p>
        <h1 className="font-display text-2xl md:text-3xl mb-4">Website is Being Rebuilt</h1>
        <p className="text-sm text-palladio-grey leading-relaxed mb-10">
          We&apos;re working on something new. Please check back in a few weeks — access will open again soon.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(false);
            }}
            placeholder="Access Password"
            autoComplete="off"
            className="w-full border border-palladio-border bg-white px-4 py-3 text-sm text-center outline-none focus:border-black"
          />
          <button type="submit" className="btn-solid w-full">
            Enter
          </button>
          {error && (
            <p className="text-xs text-red-600 pt-1">
              {SITE_PASSWORD
                ? "Incorrect password. Try again."
                : "No access password is configured yet (set VITE_SITE_ACCESS_PASSWORD in .env.local)."}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
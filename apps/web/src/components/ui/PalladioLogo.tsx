/**
 * Palladio wordmark — the real registered logo (PALLADIO®).
 *
 * Rendered from /public/logo-wordmark.svg via a CSS mask so the mark is painted
 * in `currentColor`. That makes it automatically adapt to its background:
 *   - on a light surface it inherits the dark text colour (default)
 *   - on a dark surface pass `invert` (or set the text colour) and it turns white
 *
 * Using a mask keeps a single source SVG for both variants (no separate
 * light/dark files to keep in sync) and avoids a broken-image state — if the
 * asset ever fails to load the element is simply empty rather than showing a
 * browser placeholder.
 */

// Intrinsic aspect ratio of the wordmark artwork (from the SVG viewBox).
const WORDMARK_RATIO = "321.58 / 53.41";

export default function PalladioLogo({ className, invert }: { className?: string; invert?: boolean }) {
  return (
    <span
      role="img"
      aria-label="Palladio"
      className={`inline-block align-middle select-none ${invert ? "text-white" : ""} ${className || ""}`}
      style={{
        aspectRatio: WORDMARK_RATIO,
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/logo-wordmark.svg)",
        maskImage: "url(/logo-wordmark.svg)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

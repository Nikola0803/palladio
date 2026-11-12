/**
 * Palladio wordmark. Uses the real dark logo (palladio-logo-dark.png) once
 * it's dropped into /public/logo-dark.png — see README "Assets to add"
 * section. Falls back to a styled text wordmark so the header/footer still
 * look intentional if the image is ever missing (e.g. build without the
 * asset), rather than showing a broken image icon.
 */
export default function PalladioLogo({ className, invert }: { className?: string; invert?: boolean }) {
  return (
    <span
      className={`inline-flex items-center uppercase tracking-[0.42em] text-[1.6rem] md:text-[2.1rem] leading-none select-none ${invert ? "text-white" : ""} ${className || ""}`}
      style={{ fontFamily: "var(--font-logo)" }}
    >
      Palladio
    </span>
  );
}

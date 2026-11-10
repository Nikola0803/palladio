/**
 * Palladio wordmark. Uses the real dark logo (palladio-logo-dark.png) once
 * it's dropped into /public/logo-dark.png — see README "Assets to add"
 * section. Falls back to a styled text wordmark so the header/footer still
 * look intentional if the image is ever missing (e.g. build without the
 * asset), rather than showing a broken image icon.
 */
export default function PalladioLogo({ className, invert }: { className?: string; invert?: boolean }) {
  return (
    <span className={`inline-flex items-center ${className || ""}`}>
      <img
        src="/logo-dark.png"
        alt="Palladio"
        className={`h-full w-auto object-contain ${invert ? "invert" : ""}`}
        onError={(e) => {
          // No logo file present yet — hide the broken image and let the
          // text fallback (sibling span) show instead.
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "inline-block";
        }}
      />
      <span
        className="hidden uppercase tracking-[0.42em] text-[1.6rem] md:text-[2.1rem] leading-none select-none"
        style={{ fontFamily: "var(--font-logo)", fontWeight: 500 }}
        aria-hidden="true"
      >
        Palladio
      </span>
    </span>
  );
}

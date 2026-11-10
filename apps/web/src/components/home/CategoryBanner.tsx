import { Link } from "react-router-dom";

/**
 * Full-bleed category banner in the Bvlgari homepage rhythm: big image,
 * small uppercase title and underlined CTA anchored bottom-left.
 */
export default function CategoryBanner({
  title,
  href,
  imageUrl,
  ctaLabel = "Discover the collection",
}: {
  title: string;
  href: string;
  imageUrl?: string | null;
  ctaLabel?: string;
}) {
  return (
    <Link to={href} className="group relative block w-full h-[100vh] min-h-[560px] overflow-hidden bg-[#eeece8]">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />
      <div className="absolute left-0 bottom-0 px-5 md:px-10 pb-8 md:pb-10 text-white">
        <h3 className="bv-title mb-3">{title}</h3>
        <span className="uppercase text-[11px] tracking-[0.12em] border-b border-white pb-0.5">{ctaLabel}</span>
      </div>
    </Link>
  );
}

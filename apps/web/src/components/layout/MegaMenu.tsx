import { Link } from "react-router-dom";
import { useAsync } from "../../hooks/useAsync";
import { useCategoryImages } from "../../hooks/useCategoryImages";
import { getProducts } from "../../lib/api";
import { fullSize } from "../../lib/images";
import type { Category } from "../../types/catalog";

/**
 * Full-width Jewellery mega menu, laid out like the Bvlgari reference:
 * left column with "By category" text links and a grid of round thumbnails,
 * a quick-links column, and a tall promo image with two links. Everything
 * is driven by the live WooCommerce categories and products.
 */
function SectionHeading({ label, href, onClose }: { label: string; href: string; onClose: () => void }) {
  return (
    <p className="text-[13px] uppercase tracking-[0.04em] mb-4 flex items-center gap-3">
      {label}
      <span className="text-palladio-border">|</span>
      <Link to={href} onClick={onClose} className="underline underline-offset-4 hover:opacity-60">
        View all
      </Link>
    </p>
  );
}

export default function MegaMenu({
  open,
  topLevel,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  open: boolean;
  topLevel: Category[];
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const images = useCategoryImages(topLevel);
  const { data: promo } = useAsync(() => getProducts({ random: true, perPage: 7 }), []);
  const promoProduct = promo?.items?.[0];
  const featuredPieces = (promo?.items || []).slice(1, 7);
  const promoImage = fullSize(promoProduct?.images?.[0]?.src);

  const quickLinks = [
    { label: "Gold & Silver", href: "/gold-silver" },
    { label: "Engagement & Wedding", href: "/engagement-wedding" },
    { label: "Custom Pieces", href: "/contact-us" },
    { label: "Journal", href: "/blog" },
  ];

  return (
    <div
      className={`${open ? "block" : "hidden"} absolute top-full left-0 w-full bg-white border-t border-palladio-border shadow-[0_20px_40px_-20px_rgba(0,0,0,0.25)] z-40`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="max-w-8xl mx-auto px-10 py-9 grid grid-cols-[minmax(0,1.7fr)_180px_340px] gap-14">
        <div>
          <SectionHeading label="By category" href="/jewellery" onClose={onClose} />
          <div className="grid grid-cols-6 gap-x-5 gap-y-6 mb-10">
            {topLevel.map((c) => (
              <Link key={c.id} to={`/collection/${c.slug}`} onClick={onClose} className="group text-center">
                <div className="w-[90px] h-[90px] rounded-full bg-[#f4f3f1] overflow-hidden mx-auto mb-3">
                  {images[c.id] && (
                    <img
                      src={images[c.id]}
                      alt={c.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                </div>
                <span className="text-[12px] group-hover:opacity-60">{c.name}</span>
              </Link>
            ))}
          </div>

          {featuredPieces.length > 0 && (
            <>
              <SectionHeading label="Featured pieces" href="/jewellery" onClose={onClose} />
              <div className="grid grid-cols-6 gap-x-5">
                {featuredPieces.map((p) => (
                  <Link key={p.id} to={`/product/${p.slug}`} onClick={onClose} className="group text-center">
                    <div className="w-[90px] h-[90px] rounded-full bg-[#f4f3f1] overflow-hidden mx-auto mb-3">
                      {p.images?.[0] && (
                        <img
                          src={p.images[0].src}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                    </div>
                    <span className="text-[12px] line-clamp-2 group-hover:opacity-60">{p.name}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <ul className="space-y-4 text-[13px] pt-9">
          {quickLinks.map((l) => (
            <li key={l.href}>
              <Link to={l.href} onClick={onClose} className="hover:opacity-60">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {promoProduct && (
          <div className="relative h-[420px] bg-[#f4f3f1] overflow-hidden">
            <img src={promoImage} alt={promoProduct.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <h3 className="bv-title mb-4 line-clamp-2">{promoProduct.name}</h3>
              <Link
                to={`/product/${promoProduct.slug}`}
                onClick={onClose}
                className="block uppercase text-[11px] tracking-[0.12em] underline underline-offset-4 mb-3"
              >
                Discover the creation
              </Link>
              <Link
                to="/jewellery"
                onClick={onClose}
                className="block uppercase text-[11px] tracking-[0.12em] underline underline-offset-4"
              >
                Discover the collection
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

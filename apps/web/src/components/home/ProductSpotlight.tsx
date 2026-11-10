import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "../ui/icons";
import type { Product } from "../../types/catalog";

/**
 * Centered single-product carousel spotlight — matches the reference
 * homepage's "product of the moment" section: a small floating product
 * image on a light background, prev/next chevrons cycling between real
 * products, and a "Discover Now" CTA into that product's page. Driven by
 * whatever real products are passed in (a handful pulled from the random
 * catalog endpoint on the homepage) — no fabricated content.
 */
export default function ProductSpotlight({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  if (products.length === 0) return null;

  const product = products[index % products.length];
  const image = product.images?.[0];

  const prev = () => setIndex((i) => (i - 1 + products.length) % products.length);
  const next = () => setIndex((i) => (i + 1) % products.length);

  return (
    <section className="relative bg-palladio-offwhite py-20 md:py-32 px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-center gap-4 md:gap-10">
        {products.length > 1 && (
          <button
            aria-label="Previous product"
            onClick={prev}
            className="hidden sm:flex items-center justify-center shrink-0 hover:opacity-60"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}

        <div className="text-center flex-1 max-w-sm">
          <div className="aspect-square w-64 md:w-80 mx-auto mb-10 flex items-center justify-center">
            {image ? (
              <img src={image.src} alt={image.alt || product.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#f2efe9] to-[#e0dbcd]" />
            )}
          </div>
          <h2 className="bv-title md:text-[22px] mb-4">{product.name}</h2>
          {product.short_description && (
            <div
              className="text-sm text-palladio-grey leading-relaxed mb-8 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}
          <Link to={`/product/${product.slug}`} className="btn-solid">
            Discover Now
          </Link>
        </div>

        {products.length > 1 && (
          <button
            aria-label="Next product"
            onClick={next}
            className="hidden sm:flex items-center justify-center shrink-0 hover:opacity-60"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {products.length > 1 && (
        <div className="flex sm:hidden items-center justify-center gap-8 mt-6">
          <button aria-label="Previous product" onClick={prev} className="hover:opacity-60">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button aria-label="Next product" onClick={next} className="hover:opacity-60">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
}

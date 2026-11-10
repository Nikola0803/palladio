import { Link } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { getCategories, getProducts } from "../lib/api";
import ProductSpotlight from "../components/home/ProductSpotlight";

/**
 * Palladio's version of "Engagement & Wedding". Unlike Bvlgari, there's no
 * dedicated WooCommerce category (or catalog) of engagement/wedding rings
 * behind this yet — Palladio's engagement/wedding work is custom-order, so
 * this page is honestly framed as a commission inquiry, not a product
 * listing pretending to have stock that doesn't exist. If a real
 * "Engagement" or "Wedding" WooCommerce category is created later, this
 * will automatically start showing those real products instead.
 */
export default function EngagementWeddingPage() {
  const { data: categories } = useAsync(() => getCategories(), []);
  const engagementCategory = categories?.find(
    (c) => /engagement|wedding/i.test(c.name) || /engagement|wedding/i.test(c.slug)
  );

  const { data: realProducts } = useAsync(
    () =>
      engagementCategory
        ? getProducts({ category: engagementCategory.slug, perPage: 6 })
        : Promise.resolve(null),
    [engagementCategory?.slug]
  );

  // Fall back to rings (the closest real product type) purely for imagery
  // on this page — never claimed to be "engagement rings" unless they
  // actually live in a real engagement/wedding category.
  const ringsCategory = categories?.find((c) => /ring/i.test(c.name));
  const { data: ringProducts } = useAsync(
    () => (!engagementCategory && ringsCategory ? getProducts({ category: ringsCategory.slug, perPage: 6 }) : Promise.resolve(null)),
    [engagementCategory, ringsCategory?.slug]
  );

  const products = realProducts?.items?.length ? realProducts.items : ringProducts?.items || [];
  const heroImage = products[0]?.images?.[0];

  return (
    <>
      <section className="relative w-full h-[55vh] min-h-[380px] overflow-hidden bg-palladio-offwhite flex items-center justify-center">
        {heroImage ? (
          <img src={heroImage.src} alt={heroImage.alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#efe6d6] to-[#8f877a]" />
        )}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
          <p className="tracked-label mb-4 opacity-90">Made to Order</p>
          <h1 className="bv-title md:text-[22px] mb-4">Engagement &amp; Wedding</h1>
          <p className="text-sm max-w-md opacity-90">Custom rings and bands, built around your story.</p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="bv-title mb-6">A Piece Made for the Two of You</h2>
        <p className="text-sm text-palladio-grey leading-relaxed mb-8">
          Palladio doesn&apos;t keep a fixed engagement or wedding collection in stock — every ring we make
          for a proposal or a wedding is a custom commission, built to your specs in gold or silver. Tell us
          what you have in mind — metal, stone, budget, timeline — and we&apos;ll work it out with you
          directly.
        </p>
        <Link to="/contact-us" className="btn-solid">
          Start a Custom Order
        </Link>
      </section>

      {products.length > 0 && (
        <>
          <p className="text-center tracked-label text-palladio-grey mb-2">
            {engagementCategory ? "From the Collection" : "For Reference — Recent Ring Work"}
          </p>
          <ProductSpotlight products={products} />
        </>
      )}
    </>
  );
}

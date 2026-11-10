import { Link } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { getCategories, getProducts } from "../lib/api";
import { fullSize } from "../lib/images";
import type { Category, Product } from "../types/catalog";

/**
 * Gold & Silver material story, structured like a Bvlgari material page:
 * campaign image, title + intro, craft story, full-bleed banner, statement,
 * one featured piece, then a row of three more. All imagery and products
 * come from the live catalog. If dedicated Gold / Silver categories exist
 * they are used; otherwise it falls back to a spread of real products.
 */
function findMaterialCategory(categories: Category[], keyword: string) {
  return categories.find((c) => c.name.toLowerCase().includes(keyword) || c.slug.toLowerCase().includes(keyword));
}

const imageOf = (p?: Product) => fullSize(p?.images?.[0]?.src);

function Backdrop({ product, lazy }: { product?: Product; lazy?: boolean }) {
  const src = imageOf(product);
  const thumb = product?.images?.[0]?.src;
  const alt = product?.name || "";
  if (!src) return null;
  return (
    <>
      <img src={thumb} alt="" aria-hidden="true" loading={lazy ? "lazy" : undefined} className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl" />
      <img src={src} alt={alt} loading={lazy ? "lazy" : undefined} className="absolute inset-0 w-full h-full object-contain" />
    </>
  );
}

function stripTags(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

function PieceCard({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="aspect-[4/3] bg-[#f4f3f1] overflow-hidden mb-5">
        <img
          src={product.images?.[0]?.src}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <h3 className="bv-title mb-2">{product.name}</h3>
      <p className="text-[13px] text-palladio-grey leading-relaxed line-clamp-2">{stripTags(product.short_description || "")}</p>
    </Link>
  );
}

export default function GoldSilverPage() {
  const { data: categories } = useAsync(() => getCategories(), []);
  const goldCategory = categories ? findMaterialCategory(categories, "gold") : undefined;
  const silverCategory = categories ? findMaterialCategory(categories, "silver") : undefined;

  const { data: fallback, loading } = useAsync(() => getProducts({ random: true, perPage: 12 }), []);
  const { data: gold } = useAsync(
    () => (goldCategory ? getProducts({ category: goldCategory.slug, perPage: 6 }) : Promise.resolve(null)),
    [goldCategory?.slug]
  );
  const { data: silver } = useAsync(
    () => (silverCategory ? getProducts({ category: silverCategory.slug, perPage: 6 }) : Promise.resolve(null)),
    [silverCategory?.slug]
  );

  const materialProducts = [...(gold?.items || []), ...(silver?.items || [])];
  const pool = (materialProducts.length ? materialProducts : fallback?.items || []).filter((p) => p.images?.length);

  const [heroP, craftP, bannerP, featured, ...rest] = pool;
  const row = rest.slice(0, 3);
  const shopCategory = goldCategory || silverCategory;

  if (loading && pool.length === 0) {
    return <div className="max-w-8xl mx-auto px-6 py-24 text-center text-palladio-grey">Loading…</div>;
  }

  return (
    <>
      {/* Campaign image */}
      <section className="relative w-full h-[calc(100vh-150px)] min-h-[520px] bg-[#e9e6e1] overflow-hidden">
        <Backdrop product={heroP} />
      </section>

      {/* Title + intro */}
      <section className="max-w-2xl mx-auto px-6 py-16 md:py-24 text-center">
        <h1 className="bv-title md:text-[22px] mb-5">Gold &amp; Silver</h1>
        <p className="text-sm md:text-base leading-relaxed text-palladio-grey">
          Palladio brings two metals together in one language of craft. Warm gold and bright silver, each made
          to order and finished by hand.
        </p>
      </section>

      {/* Craft story */}
      {craftP && (
        <section className="max-w-6xl mx-auto px-6 pb-20 md:pb-28 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
          <div className="aspect-[4/5] bg-[#f4f3f1] overflow-hidden">
            <img src={imageOf(craftP)} alt={craftP.name} loading="lazy" className="w-full h-full object-cover" />
          </div>
          <div className="max-w-md">
            <p className="tracked-label text-palladio-grey mb-4">Craft meets contrast</p>
            <h2 className="bv-title md:text-[22px] mb-5">Two metals, one standard</h2>
            <p className="text-sm md:text-base leading-relaxed text-palladio-grey">
              Every piece is cast, set and polished by hand to the same standard, whatever the metal. The
              difference is in the colour, not the care.
            </p>
          </div>
        </section>
      )}

      {/* Full-bleed banner */}
      {bannerP && (
        <section className="relative w-full h-[80vh] min-h-[480px] bg-[#e9e6e1] overflow-hidden">
          <Backdrop product={bannerP} lazy />
        </section>
      )}

      {/* Statement */}
      <section className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
        <p className="text-lg md:text-2xl leading-snug">
          Made to order. Every Palladio piece starts as a real request, never a stock item.
        </p>
      </section>

      {/* Featured piece */}
      {featured && (
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-10 md:gap-16 items-center mb-16 md:mb-24">
          <Link to={`/product/${featured.slug}`} className="block aspect-[7/6] bg-[#f4f3f1] overflow-hidden">
            <img src={imageOf(featured)} alt={featured.name} loading="lazy" className="w-full h-full object-contain" />
          </Link>
          <div>
            <h2 className="bv-title md:text-[22px] mb-4">{featured.name}</h2>
            <p className="text-sm leading-relaxed text-palladio-grey mb-8 line-clamp-5">
              {stripTags(featured.short_description || "")}
            </p>
            <Link to={`/product/${featured.slug}`} className="btn-solid">
              Discover Now
            </Link>
          </div>
        </section>
      )}

      {/* Row of three */}
      {row.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-20 md:pb-28 grid grid-cols-1 md:grid-cols-3 gap-10">
          {row.map((p) => (
            <PieceCard key={p.id} product={p} />
          ))}
        </section>
      )}

      {shopCategory && (
        <div className="text-center pb-24">
          <Link to={`/collection/${shopCategory.slug}`} className="btn-outline">
            Shop {goldCategory && silverCategory ? "Gold & Silver" : shopCategory.name}
          </Link>
        </div>
      )}
    </>
  );
}

import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { getCategories, getProducts } from "../lib/api";
import { useCategoryImages } from "../hooks/useCategoryImages";
import ProductCard from "../components/product/ProductCard";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import { ChevronDownIcon, ChevronUpIcon } from "../components/ui/icons";
import type { Category, Product } from "../types/catalog";

/**
 * Large, bold, real editorial tile woven into the product grid — an actual
 * link into another real Palladio category (with that category's real
 * WooCommerce image), not a decorative filler. This is what was missing
 * from the plain product-only mosaic: Bulgari's PLP grids always mix in a
 * few big campaign-style image links between the product tiles.
 */
function EditorialTile({ category, image }: { category: Category; image?: string }) {
  return (
    <Link
      to={`/collection/${category.slug}`}
      className="group relative block h-full min-h-[320px] overflow-hidden bg-palladio-black"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{
          backgroundImage: image
            ? `url(${image})`
            : "linear-gradient(135deg,#2a2622 0%,#0f0e0c 100%)",
        }}
      />
      <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
        <p className="tracked-label mb-3 opacity-80">Shop the Edit</p>
        <h3 className="bv-title md:text-[22px] mb-4">{category.name}</h3>
        <span className="tracked-label border-b border-white pb-1">Discover</span>
      </div>
    </Link>
  );
}

type SortKey = "default" | "price-asc" | "price-desc" | "name-asc";
type PriceKey = "any" | "under-100" | "100-300" | "300-plus";

const PER_PAGE = 24;

// Facets shown in the "Filter by" row. Only Category and Price are wired to
// real filtering logic below — the rest (Color/Material/Gemstone/Diamond
// Pavé) don't have a WooCommerce data source yet, so they're presented
// honestly as disabled/coming-soon rather than faked with no effect.
const VISUAL_ONLY_FACETS = ["Color", "Material", "Gemstone", "Diamond Pavé"];

function sortProducts(items: Product[], sort: SortKey): Product[] {
  if (sort === "default") return items;
  const copy = [...items];
  if (sort === "price-asc") copy.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  if (sort === "price-desc") copy.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  if (sort === "name-asc") copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy;
}

function filterByPrice(items: Product[], key: PriceKey): Product[] {
  if (key === "any") return items;
  return items.filter((p) => {
    const price = Number(p.price || 0);
    if (key === "under-100") return price < 100;
    if (key === "100-300") return price >= 100 && price <= 300;
    if (key === "300-plus") return price > 300;
    return true;
  });
}

export default function CollectionPage({ all = false }: { all?: boolean }) {
  const { slug: routeSlug = "" } = useParams<{ slug: string }>();
  const slug = all ? "" : routeSlug;

  const { data: categories } = useAsync(() => getCategories(), []);
  const category = all ? undefined : categories?.find((c) => c.slug === slug);
  const topLevelCats = useMemo(() => (categories || []).filter((c) => c.parent === 0 && !/grillz/i.test(c.name)), [categories]);
  const categoryImages = useCategoryImages(categories);
  const subcategories = useMemo(
    () => (all ? topLevelCats : category ? (categories || []).filter((c) => c.parent === category.id) : []),
    [categories, category, all, topLevelCats]
  );
  const parentCategory = category?.parent ? categories?.find((c) => c.id === category.parent) : null;

  // Real categories (with a real image) available to feature as editorial
  // links inside the grid — prefer this collection's own subcategories,
  // fall back to sibling/other categories so smaller collections still get
  // real link tiles rather than none at all.
  const editorialPool = useMemo(() => {
    const withImages = (cats: Category[]) => cats.filter((c) => categoryImages[c.id] && c.slug !== slug);
    const fromSubs = withImages(subcategories);
    if (fromSubs.length > 0) return fromSubs;
    return withImages(categories || []);
  }, [categories, subcategories, slug, categoryImages]);

  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<Product[]>([]);
  const [sort, setSort] = useState<SortKey>("default");
  const [priceFilter, setPriceFilter] = useState<PriceKey>("any");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    setPage(1);
    setAccumulated([]);
    setCategoryFilter("");
    setPriceFilter("any");
  }, [slug]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const effectiveSlug = categoryFilter || slug;
  const { data: productData, loading, error } = useAsync(
    () => getProducts({ category: effectiveSlug, perPage: PER_PAGE, page }),
    [effectiveSlug, page]
  );

  useEffect(() => {
    if (!productData) return;
    setAccumulated((prev) => (page === 1 ? productData.items : [...prev, ...productData.items]));
  }, [productData, page]);

  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [categoryFilter]);

  const visible =
    all && !categoryFilter ? accumulated.filter((p) => !p.categories.every((c) => /grillz/i.test(c.name))) : accumulated;
  const priceFiltered = filterByPrice(visible, priceFilter);
  const sorted = sortProducts(priceFiltered, sort);
  const hasMore = productData ? accumulated.length < productData.total : false;
  const showingCount = sorted.length;
  const totalCount = productData?.total ?? 0;

  if (error) {
    return (
      <section className="max-w-8xl mx-auto px-6 py-24 text-center">
        <h1 className="bv-title mb-4">{slug.replace(/-/g, " ")}</h1>
        <p className="text-palladio-grey max-w-md mx-auto">
          Couldn&apos;t reach the Palladio catalog API ({error.message}).
        </p>
      </section>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(parentCategory ? [{ label: parentCategory.name, href: `/collection/${parentCategory.slug}` }] : []),
          { label: all ? "Jewellery" : category?.name || slug.replace(/-/g, " ") },
        ]}
      />

      <section className="text-center px-6 pt-10 md:pt-16">
        <h1 className="bv-title md:text-[22px]">
          {all ? "Fine Jewellery" : category?.name || slug.replace(/-/g, " ")}
        </h1>
      </section>

      {category?.description && (
        <p
          className="max-w-2xl mx-auto text-center text-sm text-palladio-grey px-6 py-12"
          dangerouslySetInnerHTML={{ __html: category.description }}
        />
      )}

      {subcategories.length > 0 && (
        <div className="max-w-8xl mx-auto px-6 pt-10 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setCategoryFilter("")}
            className={`tracked-label rounded-full px-5 py-2 border transition-colors ${
              !categoryFilter ? "bg-black text-white border-black" : "border-palladio-border hover:border-black"
            }`}
          >
            All
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setCategoryFilter(sub.slug)}
              className={`tracked-label rounded-full px-5 py-2 border transition-colors ${
                categoryFilter === sub.slug ? "bg-black text-white border-black" : "border-palladio-border hover:border-black"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      <section className="max-w-8xl mx-auto px-6 pb-24 pt-10">
        {productData && productData.total > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <p className="text-xs text-palladio-grey">
                Showing {showingCount} of {totalCount}
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFiltersOpen((v) => !v)}
                  className="tracked-label text-xs flex items-center gap-1.5 hover:opacity-60"
                >
                  Filter by
                  {filtersOpen ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                </button>
                <label className="tracked-label text-xs flex items-center gap-1.5">
                  Sort by
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="tracked-label text-xs border border-palladio-border px-3 py-2 bg-white"
                  >
                    <option value="default">Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A–Z</option>
                  </select>
                </label>
              </div>
            </div>

            {filtersOpen && (
              <div className="border-y border-palladio-border py-5 flex flex-wrap gap-x-8 gap-y-4">
                <label className="text-xs flex flex-col gap-1.5">
                  <span className="tracked-label text-palladio-grey">Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-palladio-border px-3 py-2 min-w-[160px]"
                  >
                    <option value="">All</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.slug}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs flex flex-col gap-1.5">
                  <span className="tracked-label text-palladio-grey">Price</span>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value as PriceKey)}
                    className="border border-palladio-border px-3 py-2 min-w-[160px]"
                  >
                    <option value="any">Any</option>
                    <option value="under-100">Under €100</option>
                    <option value="100-300">€100 – €300</option>
                    <option value="300-plus">€300+</option>
                  </select>
                </label>
                {VISUAL_ONLY_FACETS.map((facet) => (
                  <label key={facet} className="text-xs flex flex-col gap-1.5 opacity-40 cursor-not-allowed">
                    <span className="tracked-label">{facet}</span>
                    <select disabled className="border border-palladio-border px-3 py-2 min-w-[160px] bg-palladio-offwhite">
                      <option>Coming soon</option>
                    </select>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && page === 1 ? (
          <p className="text-center text-palladio-grey py-12">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-center text-palladio-grey py-12">No products found in this category yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[minmax(0,1fr)] [grid-auto-flow:dense] gap-x-8 gap-y-12">
              {sorted.map((product, i) => {
                // Mosaic/editorial rhythm: every 6th slot becomes a real,
                // clickable category tile spanning two rows instead of a
                // product — matches the reference layout's large campaign
                // tiles interspersed between product tiles, and cycles
                // through the real category pool so repeat visits/pages
                // don't always show the same tile.
                const editorialSlot = i !== 0 && i % 6 === 0;
                const editorialCategory =
                  editorialSlot && editorialPool.length > 0
                    ? editorialPool[(i / 6 - 1) % editorialPool.length]
                    : null;

                return (
                  <Fragment key={product.id}>
                    {editorialCategory && (
                      <div key={`editorial-${editorialCategory.id}-${i}`} className="md:row-span-2">
                        <EditorialTile category={editorialCategory} image={categoryImages[editorialCategory.id]} />
                      </div>
                    )}
                    <div>
                      <ProductCard product={product} />
                    </div>
                  </Fragment>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center mt-12">
                <button onClick={() => setPage((p) => p + 1)} disabled={loading} className="btn-outline disabled:opacity-40">
                  {loading ? "Loading…" : "See More"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <button
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-8 right-8 z-40 w-11 h-11 rounded-full bg-black text-white flex items-center justify-center shadow-lg transition-opacity ${
          showBackToTop ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronUpIcon className="w-5 h-5" />
      </button>
    </>
  );
}
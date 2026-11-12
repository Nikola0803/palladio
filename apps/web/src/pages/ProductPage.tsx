import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { getProductBySlug, getProducts } from "../lib/api";
import { getStoreProduct } from "../lib/store-api";
import AddToCartForm from "../components/product/AddToCartForm";
import ColorSwitcher, { getColorHex, isColorAttribute } from "../components/product/ColorSwitcher";
import ProductCard from "../components/product/ProductCard";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import { toggleWishlist, useWishlist } from "../lib/wishlist";
import { WishlistIcon, ShareIcon, TruckIcon, ReturnIcon } from "../components/ui/icons";

export default function ProductPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: product, loading, error } = useAsync(() => getProductBySlug(slug), [slug]);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<Record<string, string>>({});
  const wishlist = useWishlist();
  const wishlisted = wishlist.some((p) => p.id === product?.id);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: storeProduct } = useAsync(
    () => (product ? getStoreProduct(product.id) : Promise.resolve(null)),
    [product?.id]
  );

  const colorAttrs = (storeProduct?.attributes || []).filter(
    (a) => a.has_variations && isColorAttribute(a.name)
  );

  const variationPayload = colorAttrs.flatMap((a) => {
    const val = selectedVariation[a.taxonomy || a.name];
    if (!val) return [];
    return [{ attribute: a.taxonomy || a.name, value: val }];
  });

  const primaryCategory = product?.categories?.[0];
  const { data: related } = useAsync(
    () => (primaryCategory ? getProducts({ category: primaryCategory.slug, perPage: 5 }) : Promise.resolve(null)),
    [primaryCategory?.slug]
  );
  const relatedItems = (related?.items || []).filter((p) => p.id !== product?.id).slice(0, 4);

  if (loading) {
    return <div className="max-w-8xl mx-auto px-6 py-24 text-center text-palladio-grey">Loading…</div>;
  }

  if (error || !product) {
    return (
      <section className="max-w-8xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-3xl mb-4 capitalize">{slug.replace(/-/g, " ")}</h1>
        <p className="text-palladio-grey max-w-md mx-auto">
          {error ? `Couldn't reach the Palladio catalog API (${error.message}).` : "Product not found."}
        </p>
      </section>
    );
  }

  const images = product.images?.length ? product.images : [];
  const mainImage = images[activeImage] || images[0];

  async function handleShare() {
    const shareData = { title: product!.name, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled — no-op
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(primaryCategory ? [{ label: primaryCategory.name, href: `/collection/${primaryCategory.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <section className="max-w-8xl mx-auto px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          {/* Main image */}
          <div className="w-full aspect-square bg-palladio-offwhite overflow-hidden">
            {mainImage ? (
              <img
                src={mainImage.src}
                alt={mainImage.alt || product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#f2efe9] to-[#e0dbcd]" />
            )}
          </div>

          {/* Thumbnails — horizontal scroll on mobile, grid on desktop */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-6 md:overflow-visible md:pb-0">
              {images.slice(0, 6).map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 shrink-0 md:w-auto md:h-auto md:aspect-square bg-palladio-offwhite overflow-hidden border transition-colors ${
                    i === activeImage
                      ? "border-palladio-text"
                      : "border-transparent hover:border-palladio-border"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img.src} alt={img.alt || product.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="md:sticky md:top-32 self-start">
          {primaryCategory && <p className="tracked-label text-palladio-grey mb-2">{primaryCategory.name}</p>}

          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="bv-title md:text-2xl md:leading-8">{product.name}</h1>
            <div className="flex items-center gap-3 shrink-0 pt-1">
              <button
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                onClick={() => toggleWishlist(product)}
                className="hover:opacity-60"
              >
                <WishlistIcon filled={wishlisted} className="w-5 h-5" />
              </button>
              <button aria-label="Share this product" onClick={handleShare} className="hover:opacity-60">
                <ShareIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mb-1">
            {product.on_sale ? (
              <p className="text-lg">
                <span className="line-through text-palladio-grey mr-3">€{product.regular_price}</span>
                <span>€{product.sale_price}</span>
              </p>
            ) : (
              <p className="text-lg">€{product.price}</p>
            )}
          </div>
          <p className="text-xs text-palladio-grey mb-6">Including Taxes</p>

          {product.short_description && (
            <div
              className="text-sm text-palladio-grey leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}

          {colorAttrs.length > 0 && (
            <div className="mb-2">
              {colorAttrs.map((a) => (
                <ColorSwitcher
                  key={a.id}
                  attributeName={a.name}
                  options={a.terms.map((t) => ({
                    value: t.name,
                    slug: t.slug,
                    hex: getColorHex(t.name),
                  }))}
                  selected={selectedVariation[a.taxonomy || a.name] ?? null}
                  onSelect={(slug) =>
                    setSelectedVariation((prev) => ({
                      ...prev,
                      [a.taxonomy || a.name]: slug,
                    }))
                  }
                />
              ))}
            </div>
          )}

          <div className="space-y-3">
            <AddToCartForm
              productId={product.id}
              inStock={product.stock_status === "instock"}
              variation={variationPayload.length ? variationPayload : undefined}
            />
            <a
              href="/contact-us"
              className="btn-outline w-full block text-center"
            >
              Ask About This Piece
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-8 border-t border-palladio-border pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <TruckIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Shipping</p>
                <p className="text-xs text-palladio-grey">Made to order — ships within 5–10 business days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ReturnIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Returns</p>
                <p className="text-xs text-palladio-grey">Contact us within 14 days for a return or exchange.</p>
              </div>
            </div>
          </div>

          {/* Description / Details */}
          {(product.description || (product.attributes && product.attributes.length > 0)) && (
            <div className="mt-10 border-t border-palladio-border pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {product.description && (
                <div>
                  <h2 className="tracked-label mb-3">Description</h2>
                  <div
                    className={`text-sm text-palladio-grey leading-relaxed overflow-hidden ${
                      detailsOpen ? "" : "max-h-24"
                    }`}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}
              {product.attributes && product.attributes.length > 0 && (
                <div>
                  <h2 className="tracked-label mb-3">Details</h2>
                  <dl className="text-sm space-y-2">
                    {product.attributes.map((attr) => (
                      <div key={attr.name} className="flex justify-between gap-4 border-b border-palladio-border pb-2">
                        <dt className="text-palladio-grey">{attr.name}</dt>
                        <dd className="text-right">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {product.description && (
                <button
                  onClick={() => setDetailsOpen((v) => !v)}
                  className="sm:col-span-2 text-xs tracked-label underline underline-offset-4 self-start"
                >
                  {detailsOpen ? "Read less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {product.sku && <p className="text-xs text-palladio-grey mt-6">SKU: {product.sku}</p>}
        </div>
      </section>

      {relatedItems.length > 0 && (
        <section className="max-w-8xl mx-auto px-6 pb-24 border-t border-palladio-border pt-16">
          <h2 className="bv-title text-center mb-10">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {relatedItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

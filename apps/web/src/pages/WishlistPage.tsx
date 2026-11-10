import { Link } from "react-router-dom";
import { useWishlist } from "../lib/wishlist";
import ProductCard from "../components/product/ProductCard";
import Breadcrumbs from "../components/ui/Breadcrumbs";

export default function WishlistPage() {
  const items = useWishlist();
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My Wishlist" }]} />
      <section className="max-w-8xl mx-auto px-6 py-10 md:py-16">
        <h1 className="bv-title md:text-[22px] text-center mb-12">My Wishlist</h1>
        {items.length === 0 ? (
          <div className="text-center">
            <p className="text-palladio-grey mb-8">You haven&apos;t saved any pieces yet.</p>
            <Link to="/" className="btn-solid">
              Discover the Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

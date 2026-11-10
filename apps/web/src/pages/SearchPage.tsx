import { useSearchParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { getProducts } from "../lib/api";
import ProductCard from "../components/product/ProductCard";
import Breadcrumbs from "../components/ui/Breadcrumbs";

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const { data, loading, error } = useAsync(
    () => (q ? getProducts({ search: q, perPage: 24 }) : Promise.resolve(null)),
    [q]
  );

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <section className="max-w-8xl mx-auto px-6 py-10 md:py-16">
        <h1 className="bv-title md:text-[22px] text-center mb-3">{q ? `Results for "${q}"` : "Search"}</h1>
        {data && <p className="text-xs text-palladio-grey text-center mb-12">{data.total} result(s)</p>}
        {!q && <p className="text-center text-palladio-grey">Type something in the search field above.</p>}
        {loading && <p className="text-center text-palladio-grey">Searching…</p>}
        {error && <p className="text-center text-palladio-grey">Search is unavailable right now. Please try again shortly.</p>}
        {data && data.items.length === 0 && <p className="text-center text-palladio-grey">Nothing matched your search.</p>}
        {data && data.items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

import { Link } from "react-router-dom";
import type { Product } from "../../types/catalog";

function formatPrice(price: string) {
  const num = Number(price);
  if (Number.isNaN(num) || price === "") return "";
  return num.toLocaleString(undefined, { style: "currency", currency: "EUR" });
}

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square bg-[#f4f3f1] overflow-hidden mb-4">
        {image ? (
          <img
            src={image.src}
            alt={image.alt || product.name}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#f2efe9] to-[#e0dbcd]" />
        )}
        {product.on_sale && (
          <span className="absolute top-3 left-3 tracked-label bg-black text-white px-2 py-1 text-[10px]">
            Sale
          </span>
        )}
      </div>
      <h3 className="text-[13px] uppercase tracking-[0.02em] font-normal mb-1 group-hover:opacity-70">{product.name}</h3>
      <p className="text-sm text-palladio-grey">
        {product.on_sale ? (
          <>
            <span className="line-through mr-2">{formatPrice(product.regular_price)}</span>
            <span className="text-black">{formatPrice(product.sale_price)}</span>
          </>
        ) : (
          formatPrice(product.price)
        )}
      </p>
      <span className="inline-block mt-3 uppercase text-[11px] tracking-[0.12em] border-b border-palladio-black pb-0.5">
        Discover more
      </span>
    </Link>
  );
}

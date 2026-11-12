import { useState } from "react";
import { addToCart } from "../../lib/store-api";

export default function AddToCartForm({
  productId,
  inStock,
  variation,
}: {
  productId: number;
  inStock: boolean;
  variation?: { attribute: string; value: string }[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleAddToCart() {
    setStatus("loading");
    try {
      await addToCart(productId, quantity, variation);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label htmlFor="qty" className="tracked-label text-sm">
          Quantity
        </label>
        <select
          id="qty"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border border-black px-3 py-2 text-sm"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!inStock || status === "loading"}
        className="btn-solid w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {!inStock ? "Out of Stock" : status === "loading" ? "Adding..." : status === "success" ? "Added to Bag" : "Add to Bag"}
      </button>

      {status === "error" && (
        <p className="text-xs text-red-600">
          Couldn&apos;t reach the WooCommerce Store API. Confirm VITE_WP_URL is set and the site's
          Store API is reachable (see .env.example).
        </p>
      )}
    </div>
  );
}

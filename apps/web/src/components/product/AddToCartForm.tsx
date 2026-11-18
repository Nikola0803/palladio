import { useState } from "react";
import { addItem } from "../../lib/cart";

export default function AddToCartForm({
  productId,
  slug,
  name,
  price,
  image,
  inStock,
  variation,
}: {
  productId: number;
  slug: string;
  name: string;
  price: string;
  image?: string;
  inStock: boolean;
  variation?: { attribute: string; value: string }[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function handleAddToCart() {
    setStatus("loading");
    try {
      addItem({
        id: productId,
        slug,
        name,
        price: parseFloat(price) || 0,
        quantity,
        image,
        variation,
      });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
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
        {!inStock
          ? "Out of Stock"
          : status === "loading"
          ? "Adding..."
          : status === "success"
          ? "Added to Bag ✓"
          : "Add to Bag"}
      </button>
    </div>
  );
}

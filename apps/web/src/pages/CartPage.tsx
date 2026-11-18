import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CART_EVENT, getCartItems, removeItem, setItemQuantity, cartTotal, type CartItem } from "../lib/cart";
import Breadcrumbs from "../components/ui/Breadcrumbs";

export default function CartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);

  function load() {
    setItems(getCartItems());
  }

  useEffect(() => {
    load();
    window.addEventListener(CART_EVENT, load);
    return () => window.removeEventListener(CART_EVENT, load);
  }, []);

  function remove(id: number) {
    removeItem(id);
  }

  function changeQty(id: number, qty: number) {
    setItemQuantity(id, qty);
  }

  const total = cartTotal(items);

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shopping Bag" }]} />
      <section className="max-w-5xl mx-auto px-6 py-10 md:py-16">
        <h1 className="bv-title md:text-[22px] text-center mb-12">Shopping Bag</h1>

        {items.length === 0 && (
          <div className="text-center">
            <p className="text-palladio-grey mb-8">Your bag is empty.</p>
            <Link to="/" className="btn-solid">
              Continue Shopping
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-12">
            <ul className="divide-y divide-palladio-border border-y border-palladio-border">
              {items.map((item) => (
                <li key={item.id} className="flex gap-5 py-6">
                  <Link to={`/product/${item.slug}`} className="w-28 h-28 shrink-0 bg-[#f4f3f1]">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    )}
                  </Link>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between gap-4">
                      <p className="text-[13px] uppercase">{item.name}</p>
                      <p className="text-sm">
                        {(item.price * item.quantity).toLocaleString(undefined, {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <select
                        value={item.quantity}
                        onChange={(e) => changeQty(item.id, Number(e.target.value))}
                        className="border border-palladio-border px-2 py-1 text-sm"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => remove(item.id)}
                        className="tracked-label text-xs underline underline-offset-4 hover:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="self-start bg-[#f6f5f2] p-6">
              <div className="flex justify-between mb-2 text-sm">
                <span className="tracked-label">Total</span>
                <span>
                  {total.toLocaleString(undefined, { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <p className="text-xs text-palladio-grey mb-6">Taxes included. Shipping calculated at checkout.</p>
              <button
                onClick={() => navigate("/checkout")}
                className="btn-solid w-full block text-center"
              >
                Checkout
              </button>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}

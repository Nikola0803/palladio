import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CART_EVENT, getCart, removeCartItem, updateCartItem } from "../lib/store-api";
import Breadcrumbs from "../components/ui/Breadcrumbs";

interface CartItem {
  key: string;
  name: string;
  quantity: number;
  permalink: string;
  images: { src: string; alt: string }[];
  totals: { line_total: string; currency_minor_unit: number };
}
interface Cart {
  items: CartItem[];
  totals: { total_price: string; currency_minor_unit: number; currency_code: string };
}


function money(minor: string, unit: number, currency: string) {
  return (Number(minor) / 10 ** unit).toLocaleString(undefined, { style: "currency", currency });
}

function slugFromPermalink(url: string) {
  return url.split("/").filter(Boolean).pop() || "";
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setCart(await getCart());
      setError(false);
    } catch {
      setError(true);
    }
  }
  useEffect(() => {
    load();
    window.addEventListener(CART_EVENT, load);
    return () => window.removeEventListener(CART_EVENT, load);
  }, []);

  async function change(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shopping Bag" }]} />
      <section className="max-w-5xl mx-auto px-6 py-10 md:py-16">
        <h1 className="bv-title md:text-[22px] text-center mb-12">Shopping Bag</h1>

        {error && (
          <p className="text-center text-sm text-palladio-grey">
            We couldn&apos;t load your bag right now. Please refresh, or contact us and we&apos;ll help.
          </p>
        )}

        {!error && cart && cart.items.length === 0 && (
          <div className="text-center">
            <p className="text-palladio-grey mb-8">Your bag is empty.</p>
            <Link to="/" className="btn-solid">
              Continue Shopping
            </Link>
          </div>
        )}

        {cart && cart.items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-12">
            <ul className="divide-y divide-palladio-border border-y border-palladio-border">
              {cart.items.map((item) => (
                <li key={item.key} className="flex gap-5 py-6">
                  <Link to={`/product/${slugFromPermalink(item.permalink)}`} className="w-28 h-28 shrink-0 bg-[#f4f3f1]">
                    {item.images[0] && <img src={item.images[0].src} alt={item.name} className="w-full h-full object-contain" />}
                  </Link>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between gap-4">
                      <p className="text-[13px] uppercase">{item.name}</p>
                      <p className="text-sm">
                        {money(item.totals.line_total, item.totals.currency_minor_unit, cart.totals.currency_code)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <select
                        value={item.quantity}
                        disabled={busy}
                        onChange={(e) => change(() => updateCartItem(item.key, Number(e.target.value)))}
                        className="border border-palladio-border px-2 py-1 text-sm"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                      <button
                        disabled={busy}
                        onClick={() => change(() => removeCartItem(item.key))}
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
                <span>{money(cart.totals.total_price, cart.totals.currency_minor_unit, cart.totals.currency_code)}</span>
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

/**
 * Client for the public WooCommerce Store API (cart). Cookie-based cart
 * sessions, no API keys required — safe to call from the browser.
 * Docs: https://developer.woocommerce.com/docs/apis/store-api/
 */
const WP_URL = (import.meta.env.VITE_WP_URL || "").replace(/\/+$/, "");
const STORE_API_BASE = `${WP_URL}/wp-json/wc/store/v1`;

async function storeApiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${STORE_API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Store API error ${res.status}: ${body}`);
  }
  return res.json();
}

export const CART_EVENT = "palladio:cart-changed";
const notify = <T,>(v: T): T => {
  window.dispatchEvent(new Event(CART_EVENT));
  return v;
};

export function getCart() {
  return storeApiFetch("/cart");
}

export function addToCart(
  id: number,
  quantity = 1,
  variation?: { attribute: string; value: string }[]
) {
  const payload: Record<string, unknown> = { id, quantity };
  if (variation?.length) payload.variation = variation;
  return storeApiFetch("/cart/add-item", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(notify);
}

export async function getStoreProduct(
  id: number
): Promise<{ id: number; type: string; attributes: import("../types/catalog").StoreProductAttribute[] } | null> {
  try {
    return await storeApiFetch(`/products/${id}`);
  } catch {
    return null;
  }
}

export function updateCartItem(key: string, quantity: number) {
  return storeApiFetch("/cart/update-item", {
    method: "POST",
    body: JSON.stringify({ key, quantity }),
  }).then(notify);
}

export function removeCartItem(key: string) {
  return storeApiFetch("/cart/remove-item", {
    method: "POST",
    body: JSON.stringify({ key }),
  }).then(notify);
}

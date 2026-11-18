// Cart now lives in localStorage — no WooCommerce Store API calls.
// This file re-exports from cart.ts so existing imports keep working.
export { CART_EVENT, getCartItems, addItem, removeItem, setItemQuantity } from "./cart";
export type { CartItem } from "./cart";

// Kept for ProductPage: variation attributes are no longer fetched from WC.
// Always returns null — ProductPage handles this gracefully.
export async function getStoreProduct(
  _id: number
): Promise<{ id: number; type: string; attributes: import("../types/catalog").StoreProductAttribute[] } | null> {
  return null;
}

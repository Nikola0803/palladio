export const CART_EVENT = "palladio:cart-changed";

export interface CartItem {
  id: number;
  slug: string;
  name: string;
  price: number; // EUR, full units (e.g. 149.99)
  quantity: number;
  image?: string;
  variation?: { attribute: string; value: string }[];
}

const KEY = "palladio_cart";

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCartItems(): CartItem[] {
  return read();
}

export function addItem(item: CartItem) {
  const items = read();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx].quantity += item.quantity;
  } else {
    items.push({ ...item });
  }
  write(items);
}

export function removeItem(id: number) {
  write(read().filter((i) => i.id !== id));
}

export function setItemQuantity(id: number, quantity: number) {
  const items = read();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  if (quantity <= 0) {
    write(items.filter((_, i) => i !== idx));
  } else {
    items[idx].quantity = quantity;
    write(items);
  }
}

export function clearCart() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(CART_EVENT));
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.quantity, 0);
}

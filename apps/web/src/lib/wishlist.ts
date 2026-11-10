import { useEffect, useState } from "react";
import type { Product } from "../types/catalog";

const KEY = "palladio-wishlist";
const EVENT = "palladio:wishlist-changed";

function read(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: Product[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage unavailable — wishlist just won't persist
  }
  window.dispatchEvent(new Event(EVENT));
}

export function toggleWishlist(product: Product) {
  const items = read();
  write(items.some((p) => p.id === product.id) ? items.filter((p) => p.id !== product.id) : [...items, product]);
}

export function useWishlist() {
  const [items, setItems] = useState<Product[]>(read);
  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}

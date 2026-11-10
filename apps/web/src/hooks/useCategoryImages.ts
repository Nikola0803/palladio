import { useAsync } from "./useAsync";
import { getProducts } from "../lib/api";
import type { Category } from "../types/catalog";

/**
 * Map of category id -> image URL. Uses the WooCommerce category image when
 * one is set, otherwise the first product photo in that category.
 */
export function useCategoryImages(categories: Category[] | null | undefined) {
  const { data } = useAsync(async () => {
    const list = categories || [];
    const results = await Promise.all(
      list.map((c) => (c.image ? Promise.resolve(null) : getProducts({ category: c.slug, perPage: 1 }).catch(() => null)))
    );
    const map: Record<number, string | undefined> = {};
    list.forEach((c, i) => {
      map[c.id] = c.image || results[i]?.items?.[0]?.images?.[0]?.src;
    });
    return map;
  }, [categories?.length]);
  return data || {};
}

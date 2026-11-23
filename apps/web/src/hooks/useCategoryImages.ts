import { useMemo } from "react";
import type { Category } from "../types/catalog";

/**
 * Map of category id -> image URL. Uses the WooCommerce category image when
 * one is set, otherwise the first product photo in that category.
 */
export function useCategoryImages(categories: Category[] | null | undefined) {
  // Category images now arrive in the category API response. The previous
  // implementation made one product request per category, creating a slow
  // request waterfall every time a menu or collection page opened.
  return useMemo(() => Object.fromEntries((categories || []).map((category) => [category.id, category.image || undefined])), [categories]);
}

import { useState } from "react";
import { Link } from "react-router-dom";
import type { Category } from "../../types/catalog";

/**
 * Single top-level nav entry. If the category has real WooCommerce
 * subcategories, hovering/focusing opens a simple dropdown listing them —
 * this is entirely data-driven, so it automatically reflects whatever
 * category tree exists in wp-admin with zero further code changes.
 */
export default function NavItem({ category, children }: { category: Category; children: Category[] }) {
  const [open, setOpen] = useState(false);
  const hasChildren = children.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => hasChildren && setOpen(true)}
      onMouseLeave={() => hasChildren && setOpen(false)}
    >
      <Link
        to={`/collection/${category.slug}`}
        className="tracked-label hover:opacity-60 whitespace-nowrap flex items-center gap-1"
        aria-haspopup={hasChildren ? "true" : undefined}
        aria-expanded={hasChildren ? open : undefined}
      >
        {category.name}
      </Link>

      {hasChildren && open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-40">
          <div className="bg-white border border-palladio-border shadow-lg min-w-[220px] py-3">
            {children.map((child) => (
              <Link
                key={child.id}
                to={`/collection/${child.slug}`}
                className="block px-5 py-2 text-sm hover:bg-palladio-offwhite whitespace-nowrap"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

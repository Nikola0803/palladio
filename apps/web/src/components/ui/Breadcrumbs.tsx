import { Link } from "react-router-dom";
import { ChevronRightIcon } from "./icons";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-8xl mx-auto px-6 pt-6 text-xs text-palladio-grey">
      <ol className="flex items-center flex-wrap gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {item.href ? (
              <Link to={item.href} className="hover:text-black">
                {item.label}
              </Link>
            ) : (
              <span className="text-black">{item.label}</span>
            )}
            {i < items.length - 1 && <ChevronRightIcon className="w-3 h-3 mx-1" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

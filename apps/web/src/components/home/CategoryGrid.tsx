import { Link } from "react-router-dom";
import type { Category } from "../../types/catalog";

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="max-w-8xl mx-auto px-6 py-16 md:py-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/collection/${cat.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden bg-palladio-offwhite"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: cat.image
                  ? `url(${cat.image})`
                  : "linear-gradient(135deg,#efece6 0%,#d8d2c4 100%)",
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <span className="tracked-label border-b border-white pb-1">{cat.name}</span>
              {cat.count > 0 && <span className="block text-xs mt-1 opacity-80">{cat.count} items</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

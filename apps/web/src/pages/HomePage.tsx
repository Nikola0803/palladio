import { useAsync } from "../hooks/useAsync";
import { getCategories } from "../lib/api";
import Hero from "../components/home/Hero";
import CategoryBanner from "../components/home/CategoryBanner";

// Two-section homepage: full-bleed hero, then one full-bleed featured category.
export default function HomePage() {
  const { data: categories, error: categoriesError } = useAsync(() => getCategories({ parentOnly: true }), []);

  const featured = categories?.find((c) => /grillz/i.test(c.name)) ?? categories?.[1] ?? categories?.[0];

  return (
    <>
      <Hero
        title="Palladio Jewellery Collection"
        subtitle="Discover the full collection."
        ctaLabel="Shop the Creations"
        ctaHref={categories?.[0] ? `/collection/${categories[0].slug}` : "/"}
        imageUrl="https://palladio.hr/wp-content/uploads/2026/10/render0.jpg"
      />

      {categoriesError && (
        <p className="max-w-8xl mx-auto px-6 py-12 text-center text-sm text-red-600">
          Couldn&apos;t reach the Palladio catalog API ({categoriesError.message}). Confirm the
          Palladio CMS Bridge plugin is active on your WordPress site and VITE_WP_URL is set
          correctly (see .env.example).
        </p>
      )}

      {featured && (
        <CategoryBanner
          title={featured.name}
          href={`/collection/${featured.slug}`}
          imageUrl="https://palladio.hr/wp-content/uploads/2026/10/render-1.jpg"
        />
      )}
    </>
  );
}
import { Link } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { getBlogPosts } from "../lib/wp-api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPage() {
  const { data: posts, loading, error } = useAsync(() => getBlogPosts({ perPage: 12 }), []);

  return (
    <section className="max-w-8xl mx-auto px-6 py-10 md:py-16">
      <h1 className="bv-title md:text-[22px] text-center mb-4">Journal</h1>
      <p className="text-sm text-palladio-grey text-center max-w-lg mx-auto mb-14">
        Notes on craft, drops, and what&apos;s next from Palladio — pulled straight from wp-admin.
      </p>

      {error && (
        <p className="text-center text-sm text-red-600 max-w-md mx-auto mb-10">
          Couldn&apos;t reach the blog ({error.message}). Confirm posts exist in wp-admin and the site's
          own REST API isn&apos;t blocked.
        </p>
      )}

      {loading ? (
        <p className="text-center text-palladio-grey py-12">Loading…</p>
      ) : posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {posts.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
              <div className="aspect-[4/3] bg-palladio-offwhite overflow-hidden mb-5">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#f2efe9] to-[#e0dbcd]" />
                )}
              </div>
              <p className="tracked-label text-palladio-grey mb-2">{formatDate(post.date)}</p>
              <h2 className="bv-title mb-2 group-hover:opacity-70">{post.title}</h2>
              <p className="text-sm text-palladio-grey leading-relaxed line-clamp-3">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      ) : (
        !error && (
          <p className="text-center text-palladio-grey py-12">
            No posts published yet — write your first one in wp-admin and it&apos;ll show up here
            automatically.
          </p>
        )
      )}
    </section>
  );
}

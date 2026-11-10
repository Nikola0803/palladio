import { useParams } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { getBlogPostBySlug } from "../lib/wp-api";
import Breadcrumbs from "../components/ui/Breadcrumbs";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPostPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: post, loading, error } = useAsync(() => getBlogPostBySlug(slug), [slug]);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-6 py-24 text-center text-palladio-grey">Loading…</div>;
  }

  if (error || !post) {
    return (
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="bv-title md:text-[22px] mb-4">Post Not Found</h1>
        <p className="text-palladio-grey">
          {error ? `Couldn't reach the blog (${error.message}).` : "This post doesn't exist or was unpublished."}
        </p>
      </section>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Journal", href: "/blog" }, { label: post.title }]} />

      <article className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        <p className="tracked-label text-palladio-grey text-center mb-3">
          {formatDate(post.date)}
          {post.authorName && ` · ${post.authorName}`}
        </p>
        <h1 className="bv-title md:text-[22px] text-center mb-10">{post.title}</h1>

        {post.featuredImage && (
          <div className="aspect-[16/9] bg-palladio-offwhite overflow-hidden mb-10">
            <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div
          className="prose prose-sm max-w-none text-palladio-grey leading-relaxed [&_p]:mb-5 [&_h2]:font-display [&_h2]:text-black [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3 [&_img]:w-full [&_a]:text-black [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }}
        />
      </article>
    </>
  );
}

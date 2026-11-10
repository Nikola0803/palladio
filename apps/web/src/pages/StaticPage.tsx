import { Link } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { getPageBySlug } from "../lib/wp-api";
import { STATIC_CONTENT } from "../lib/static-content";
import Breadcrumbs from "../components/ui/Breadcrumbs";

export default function StaticPage({ slug }: { slug: string }) {
  const fallback = STATIC_CONTENT[slug];
  const { data: wpPage, loading } = useAsync(() => getPageBySlug(slug).catch(() => null), [slug]);
  const title = wpPage?.title || fallback?.title || slug;

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
      <section className="max-w-2xl mx-auto px-6 py-10 md:py-16">
        <h1 className="bv-title md:text-[22px] text-center mb-10">{title}</h1>

        {wpPage?.content ? (
          <div
            className="text-sm text-palladio-grey leading-relaxed [&_p]:mb-5 [&_h2]:bv-title [&_h2]:text-black [&_h2]:mt-8 [&_h2]:mb-3 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: wpPage.content }}
          />
        ) : loading ? null : (
          fallback && (
            <div className="text-sm text-palladio-grey leading-relaxed">
              {fallback.intro && <p className="mb-8 text-center">{fallback.intro}</p>}
              {fallback.sections.map((s) => (
                <div key={s.heading} className="mb-8">
                  {s.heading && <h2 className="bv-title text-black mb-2">{s.heading}</h2>}
                  <p>{s.body}</p>
                </div>
              ))}
              <div className="text-center pt-6">
                <Link to="/contact-us" className="btn-outline">
                  Contact Us
                </Link>
              </div>
            </div>
          )
        )}
      </section>
    </>
  );
}

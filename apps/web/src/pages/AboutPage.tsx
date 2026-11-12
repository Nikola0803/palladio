import { Link } from "react-router-dom";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import { useAsync } from "../hooks/useAsync";
import { getPageBySlug } from "../lib/wp-api";
import { STATIC_CONTENT } from "../lib/static-content";

const REVIEWS = [
  {
    author: "Marko T.",
    rating: 5,
    text: "Napravljeno točno prema zamislima, kvaliteta je odlična. Svaki detalj je perfektan, preporučujem svima.",
  },
  {
    author: "Ana M.",
    rating: 5,
    text: "Kupovala sam prsten za zaruke i bila sam oduševljena cijelim procesom. Stručni savjet, brza izrada i savršen rezultat.",
  },
  {
    author: "Ivan K.",
    rating: 5,
    text: "Lančić Miami Cuban — izrada je impresivna, teža i solidnija nego što sam očekivao. Definitivno vrijednost za novac.",
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${count} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i < count ? "#a9895f" : "#e5e3df"}
          className="w-4 h-4"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function AboutPage() {
  const fallback = STATIC_CONTENT["about"];
  const { data: wpPage, loading } = useAsync(() => getPageBySlug("about").catch(() => null), []);
  const title = wpPage?.title || fallback?.title || "Our Story";

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

      {/* Google Reviews */}
      <section className="bg-palladio-offwhite py-16 md:py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="tracked-label text-palladio-grey mb-3">What Our Customers Say</p>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="bv-title md:text-[22px]">5.0</span>
              <StarRow count={5} />
            </div>
            <p className="text-xs text-palladio-grey">Google Reviews</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {REVIEWS.map((r) => (
              <div key={r.author} className="bg-white p-6 border border-palladio-border">
                <StarRow count={r.rating} />
                <p className="text-sm text-palladio-grey leading-relaxed mt-3 mb-4">&ldquo;{r.text}&rdquo;</p>
                <p className="tracked-label text-xs">{r.author}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a
              href="https://share.google/M0FjicvKs83MrQxXR"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-block"
            >
              Read All Reviews on Google
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

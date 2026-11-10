import { Link } from "react-router-dom";

export default function EditorialSection({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  imageUrl,
  reverse = false,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string | null;
  reverse?: boolean;
}) {
  return (
    <section className="max-w-8xl mx-auto px-6 py-16 md:py-24">
      <div className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-10 md:gap-16`}>
        <div
          className="w-full md:w-1/2 aspect-[4/3] bg-cover bg-center bg-palladio-offwhite"
          style={{
            backgroundImage: imageUrl ? `url(${imageUrl})` : "linear-gradient(135deg,#f2efe9 0%,#e0dbcd 100%)",
          }}
        />
        <div className="w-full md:w-1/2 max-w-lg mx-auto text-center md:text-left">
          {eyebrow && <p className="tracked-label mb-4 text-palladio-grey">{eyebrow}</p>}
          <h2 className="bv-title md:text-[22px] mb-4">{title}</h2>
          <p className="text-sm md:text-base text-palladio-grey mb-8 leading-relaxed">{body}</p>
          <Link to={ctaHref} className="btn-outline">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";

export default function Hero({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  imageUrl,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string | null;
}) {
  return (
    <section className="relative w-full h-[calc(100vh-150px)] min-h-[560px] overflow-hidden bg-[#e9e6e1]">
      {imageUrl && (
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" loading="eager" />
      )}
      <div className="absolute left-0 bottom-0 w-full px-5 md:px-10 pb-8 md:pb-10">
        <div className="bg-[#8a8a8a]/80 text-white text-center w-full max-w-[420px] px-6 py-7">
          <h1 className="text-xl md:text-[22px] leading-tight uppercase mb-3 tracking-[0.01em]">{title}</h1>
          {subtitle && <p className="text-[13px] leading-relaxed mb-5">{subtitle}</p>}
          <Link
            to={ctaHref}
            className="inline-block bg-white !text-palladio-black uppercase text-[11px] tracking-[0.12em] px-6 py-3 hover:!bg-palladio-black hover:!text-white transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

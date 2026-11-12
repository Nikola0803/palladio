import Breadcrumbs from "../components/ui/Breadcrumbs";

export default function StoreLocatorPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Find a Store" }]} />

      <section className="max-w-3xl mx-auto px-6 py-10 md:py-16 text-center">
        <h1 className="bv-title md:text-[22px] mb-4">Find a Store</h1>
        <p className="text-sm text-palladio-grey leading-relaxed max-w-lg mx-auto mb-10">
          Visit us in person to see our pieces up close, arrange a custom consultation, or pick up your order.
        </p>

        <div className="w-full aspect-video rounded overflow-hidden border border-palladio-border mb-8">
          <iframe
            title="Palladio store location"
            src="https://maps.google.com/maps?q=Palladio+zlatarnica+Zagreb&output=embed&z=15"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <a
          href="https://share.google/M0FjicvKs83MrQxXR"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-solid inline-block"
        >
          Get Directions
        </a>
      </section>
    </>
  );
}

import { useParams, useSearchParams, Link } from "react-router-dom";
import Breadcrumbs from "../components/ui/Breadcrumbs";

export default function OrderReceivedPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [params]    = useSearchParams();
  const orderKey    = params.get("key") || "";

  return (
    <>
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Order Confirmed" },
      ]} />
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="mb-8">
          <svg className="mx-auto mb-6" width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill="#1a1a1a"/>
            <path d="M18 28l7 7 13-13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="bv-title md:text-[22px] mb-3">Thank you for your order.</h1>
          {orderId && (
            <p className="text-sm text-palladio-grey">
              Order #{orderId} confirmed. You&apos;ll receive a confirmation email shortly.
            </p>
          )}
        </div>

        {orderId && orderKey && (
          <a
            href={`${(import.meta.env.VITE_WP_URL || "").replace(/\/+$/, "")}/my-account/view-order/${orderId}/?key=${orderKey}`}
            target="_blank" rel="noreferrer"
            className="tracked-label text-[11px] underline underline-offset-4 hover:opacity-60 block mb-8"
          >
            View Order Details
          </a>
        )}

        <Link to="/" className="btn-solid">
          Continue Shopping
        </Link>
      </section>
    </>
  );
}

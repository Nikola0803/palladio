import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-24 text-center">
      <h1 className="bv-title md:text-[22px] mb-4">Page not found</h1>
      <Link to="/" className="btn-outline">
        Back to home
      </Link>
    </section>
  );
}

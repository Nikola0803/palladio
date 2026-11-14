import { lazy, Suspense, Component } from "react";
import type { ReactNode } from "react";
import { Routes, Route } from "react-router-dom";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h2>Something went wrong</h2>
          <pre style={{ color: "red", whiteSpace: "pre-wrap" }}>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage"; // eager — first paint

const GoldSilverPage        = lazy(() => import("./pages/GoldSilverPage"));
const EngagementWeddingPage = lazy(() => import("./pages/EngagementWeddingPage"));
const BlogPage              = lazy(() => import("./pages/BlogPage"));
const BlogPostPage          = lazy(() => import("./pages/BlogPostPage"));
const CollectionPage        = lazy(() => import("./pages/CollectionPage"));
const ProductPage           = lazy(() => import("./pages/ProductPage"));
const ContactPage           = lazy(() => import("./pages/ContactPage"));
const StaticPage            = lazy(() => import("./pages/StaticPage"));
const StoreLocatorPage      = lazy(() => import("./pages/StoreLocatorPage"));
const AboutPage             = lazy(() => import("./pages/AboutPage"));
const CartPage              = lazy(() => import("./pages/CartPage"));
const CheckoutPage          = lazy(() => import("./pages/CheckoutPage"));
const OrderReceivedPage     = lazy(() => import("./pages/OrderReceivedPage"));
const WishlistPage          = lazy(() => import("./pages/WishlistPage"));
const SearchPage            = lazy(() => import("./pages/SearchPage"));
const NotFoundPage          = lazy(() => import("./pages/NotFoundPage"));
const PlatiPage             = lazy(() => import("./pages/PlatiPage"));

export default function App() {
  return (
    <ErrorBoundary>
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gold-silver" element={<GoldSilverPage />} />
          <Route path="/engagement-wedding" element={<EngagementWeddingPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/jewellery" element={<CollectionPage all />} />
          <Route path="/collection/:slug" element={<CollectionPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/store-locator" element={<StoreLocatorPage />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-received/:orderId" element={<OrderReceivedPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/services" element={<StaticPage slug="services" />} />
          <Route path="/newsletter" element={<StaticPage slug="newsletter" />} />
          <Route path="/shipping-returns" element={<StaticPage slug="shipping-returns" />} />
          <Route path="/faq" element={<StaticPage slug="faq" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/cad-design" element={<StaticPage slug="cad-design" />} />
          <Route path="/privacy-policy" element={<StaticPage slug="privacy-policy" />} />
          <Route path="/cookies-policy" element={<StaticPage slug="cookies-policy" />} />
          <Route path="/terms-of-use" element={<StaticPage slug="terms-of-use" />} />
          <Route path="/plati/:token" element={<PlatiPage />} />
          {/* /my-account is intentionally NOT handled here — the Palladio
              Frontend Loader plugin's SPA router excludes that prefix so
              WooCommerce's own account pages keep serving it directly. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
    </ErrorBoundary>
  );
}

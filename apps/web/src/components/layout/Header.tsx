import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAsync } from "../../hooks/useAsync";
import { getCategories } from "../../lib/api";
import { CART_EVENT, getCart } from "../../lib/store-api";
import { useWishlist } from "../../lib/wishlist";
import PalladioLogo from "../ui/PalladioLogo";
import MobileMenu from "./MobileMenu";
import NavItem from "./NavItem";
import MegaMenu from "./MegaMenu";
import AnnouncementBar from "./AnnouncementBar";
import {
  SearchIcon,
  StoreIcon,
  ServicesIcon,
  ContactIcon,
  NewsletterIcon,
  UserIcon,
  WishlistIcon,
  HamburgerIcon,
  BagIcon,
} from "../ui/icons";

const WP_URL = (import.meta.env.VITE_WP_URL || "").replace(/\/+$/, "");

export default function Header() {
  const navigate = useNavigate();
  const wishlistCount = useWishlist().length;
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [jewelleryOpen, setJewelleryOpen] = useState(false);
  // The trigger button and the mega menu panel are visually separate boxes
  // (the panel spans the full header width, not just under the button), so
  // there's a small real gap between them. A plain onMouseLeave on either
  // one closes the menu the instant the pointer crosses that gap — even
  // moving straight down into the menu can clip it for a frame. Debouncing
  // the close on a short timeout, and having BOTH the trigger and the menu
  // cancel that timeout on re-entry, bridges the gap without needing
  // pixel-perfect alignment.
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openJewelleryMenu() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setJewelleryOpen(true);
  }

  function scheduleCloseJewelleryMenu() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setJewelleryOpen(false), 200);
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);
  // Fetch the WHOLE category tree once (not just top-level) so top nav items
  // can show their real WooCommerce subcategories as a dropdown — fully
  // data-driven, reflects wp-admin's actual category structure automatically.
  const { data: allCategories } = useAsync(() => getCategories(), []);
  const topLevel = (allCategories || []).filter((c) => c.parent === 0);
  const childrenOf = (parentId: number) => (allCategories || []).filter((c) => c.parent === parentId);

  // "Grillz" gets pulled out as its own top-level nav item (a signature
  // Palladio product line, not folded into the generic Jewellery mega
  // menu) — everything else feeds the Jewellery mega menu below.
  const grillzCategory = topLevel.find((c) => /grillz/i.test(c.name));
  const jewelleryTopLevel = topLevel.filter((c) => c.id !== grillzCategory?.id);
  // Real cart item count from the WooCommerce Store API — no fabricated
  // badge numbers. Silently stays at 0 if the cart endpoint can't be
  // reached (e.g. still on local dev without a live cookie session).
  useEffect(() => {
    const load = () =>
      getCart()
        .then((c) => setCartCount(c?.items_count ?? 0))
        .catch(() => {});
    load();
    window.addEventListener(CART_EVENT, load);
    return () => window.removeEventListener(CART_EVENT, load);
  }, []);

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") || "").trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 bg-white relative">
      <AnnouncementBar />

      {/* Utility row */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-3 pb-1">
        <div className="flex items-center gap-6">
          <Link to="/store-locator" className="flex items-center gap-2 tracked-label hover:opacity-60">
            <StoreIcon className="w-4 h-4" />
            Find a Store
          </Link>
          <Link to="/services" className="flex items-center gap-2 tracked-label hover:opacity-60">
            <ServicesIcon className="w-4 h-4" />
            Services
          </Link>
          <Link to="/contact-us" className="flex items-center gap-2 tracked-label hover:opacity-60">
            <ContactIcon className="w-4 h-4" />
            Contact Us
          </Link>
          <form onSubmit={onSearch} className="flex items-center gap-2 pl-2">
            <SearchIcon className="w-4 h-4 text-palladio-grey" />
            <input
              type="search"
              name="q"
              placeholder="Search"
              autoComplete="off"
              className="w-36 xl:w-48 bg-transparent outline-none text-xs tracking-wide placeholder:text-palladio-grey"
            />
          </form>
        </div>
        <div className="flex items-center gap-6">
          <a href="#newsletter" className="flex items-center gap-2 tracked-label hover:opacity-60">
            <NewsletterIcon className="w-4 h-4" />
            Newsletter
          </a>
          <a href={`${WP_URL}/my-account/`} className="flex items-center gap-2 tracked-label hover:opacity-60">
            <UserIcon className="w-4 h-4" />
            My Account
          </a>
          <Link to="/wishlist" className="flex items-center gap-2 tracked-label hover:opacity-60">
            <WishlistIcon className="w-4 h-4" />
            My Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
          </Link>
          <Link to="/cart" className="flex items-center gap-2 tracked-label hover:opacity-60">
            <BagIcon className="w-4 h-4" />
            Shopping Bag ({cartCount})
          </Link>
        </div>
      </div>

      {/* Logo row */}
      <div className="flex items-center justify-between lg:justify-center px-4 pt-2 pb-3 lg:pt-1 lg:pb-4 relative">
        <button aria-label="Open mobile navigation" className="lg:hidden" onClick={() => setMobileOpen(true)}>
          <HamburgerIcon className="w-6 h-6" />
        </button>
        <Link to="/" aria-label="Palladio home" className="block h-8 md:h-11">
          <PalladioLogo className="h-full" />
        </Link>
        <div className="lg:hidden flex items-center gap-4">
          <Link to="/cart" aria-label="Shopping bag" className="relative">
            <BagIcon className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-palladio-black text-white text-[9px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile search row */}
      <form onSubmit={onSearch} className="lg:hidden w-full border-t border-palladio-border px-4 py-2.5 flex items-center gap-3">
        <SearchIcon className="w-4 h-4 text-palladio-grey" />
        <input
          type="search"
          name="q"
          placeholder="Search products"
          autoComplete="off"
          className="flex-1 outline-none text-sm tracking-wide"
        />
      </form>

      {/* Category nav — "Gold & Silver" and "Engagement & Wedding" are
          static editorial/commission pages (not WooCommerce categories),
          "Jewellery" is a mega menu grouping every other real category,
          "Grillz" gets its own top-level item, and "Blog" reads real
          wp-admin posts. */}
      <nav
        aria-label="primary"
        className="hidden lg:flex items-center justify-center gap-10 border-b border-palladio-border pb-3 pt-1"
      >
        <Link to="/gold-silver" className="tracked-label hover:opacity-60 whitespace-nowrap">
          Gold &amp; Silver
        </Link>

        {jewelleryTopLevel.length > 0 && (
          <div onMouseEnter={openJewelleryMenu} onMouseLeave={scheduleCloseJewelleryMenu}>
            <Link
              to="/jewellery"
              onClick={() => setJewelleryOpen(false)}
              className={`tracked-label whitespace-nowrap ${jewelleryOpen ? "" : "hover:opacity-60"}`}
              aria-haspopup="true"
              aria-expanded={jewelleryOpen}
              onFocus={openJewelleryMenu}
            >
              Jewellery
            </Link>
            {(
              <MegaMenu
                open={jewelleryOpen}
                topLevel={jewelleryTopLevel}
                onClose={() => setJewelleryOpen(false)}
                onMouseEnter={openJewelleryMenu}
                onMouseLeave={scheduleCloseJewelleryMenu}
              />
            )}
          </div>
        )}

        {grillzCategory && (
          <NavItem category={grillzCategory} children={childrenOf(grillzCategory.id)} />
        )}

        <Link to="/engagement-wedding" className="tracked-label hover:opacity-60 whitespace-nowrap">
          Engagement &amp; Wedding
        </Link>

        <Link to="/blog" className="tracked-label hover:opacity-60 whitespace-nowrap">
          Blog
        </Link>
      </nav>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} categories={allCategories || []} />
    </header>
  );
}

import { Link } from "react-router-dom";
import type { Category } from "../../types/catalog";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import PalladioLogo from "../ui/PalladioLogo";
import { CloseIcon } from "../ui/icons";

export default function MobileMenu({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const isAdmin = useIsAdmin();
  const topLevel = categories.filter((c) => c.parent === 0);
  const childrenOf = (parentId: number) => categories.filter((c) => c.parent === parentId);

  return (
    <div
      className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`absolute top-0 left-0 h-full w-[85%] max-w-sm bg-white transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-palladio-border">
          <PalladioLogo className="h-5" />
          <button aria-label="Close menu" onClick={onClose}>
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex flex-col">
          <Link to="/gold-silver" onClick={onClose} className="tracked-label px-5 py-4 border-b border-palladio-border block">
            Gold &amp; Silver
          </Link>
          {topLevel.map((cat) => {
            const children = childrenOf(cat.id);
            return (
              <div key={cat.id} className="border-b border-palladio-border">
                <Link to={`/collection/${cat.slug}`} onClick={onClose} className="tracked-label px-5 py-4 block">
                  {cat.name}
                </Link>
                {children.length > 0 && (
                  <div className="pb-2">
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        to={`/collection/${child.slug}`}
                        onClick={onClose}
                        className="block px-8 py-2 text-sm text-palladio-grey"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <Link to="/engagement-wedding" onClick={onClose} className="tracked-label px-5 py-4 border-b border-palladio-border block">
            Engagement &amp; Wedding
          </Link>
          <Link to="/blog" onClick={onClose} className="tracked-label px-5 py-4 border-b border-palladio-border block">
            Blog
          </Link>
          <Link to="/store-locator" onClick={onClose} className="tracked-label px-5 py-4 border-b border-palladio-border">
            Find a Store
          </Link>
          <a href={`${(import.meta.env.VITE_WP_URL || "").replace(/\/+$/, "")}/my-account/`} className="tracked-label px-5 py-4 border-b border-palladio-border">
            My Account
          </a>
          <Link to="/wishlist" onClick={onClose} className="tracked-label px-5 py-4 border-b border-palladio-border">
            My Wishlist
          </Link>
          {isAdmin && (
            <Link to="/cad-design" onClick={onClose} className="tracked-label px-5 py-4 border-b border-palladio-border">
              CAD Design
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon, ContactIcon, StoreIcon, InstagramIcon, TiktokIcon, FacebookIcon } from "../ui/icons";

// Only real, routed pages (see src/App.tsx) — no links to pages that don't
// exist yet, and no fabricated legal/certification content that doesn't
// apply to Palladio (this isn't Bvlgari — no "Data Protection Certification"
// or multi-region privacy notices to claim).
const footerColumns = [
  {
    title: "Customer Care",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Shipping & Returns", href: "/shipping-returns" },
    ],
  },
  {
    title: "Contact Us",
    links: [{ label: "Contact Us", href: "/contact-us", icon: ContactIcon }],
  },
  {
    title: "About Palladio",
    links: [{ label: "Our Story", href: "/about" }],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Use", href: "/terms-of-use" },
    ],
  },
];

// Placeholder hrefs ("#") until real social handles are confirmed — swap
// these for the actual Palladio profile URLs.
const socialLinks = [
  { label: "Instagram", href: import.meta.env.VITE_INSTAGRAM_URL as string | undefined, Icon: InstagramIcon },
  { label: "TikTok", href: import.meta.env.VITE_TIKTOK_URL as string | undefined, Icon: TiktokIcon },
  { label: "Facebook", href: import.meta.env.VITE_FACEBOOK_URL as string | undefined, Icon: FacebookIcon },
].filter((s): s is { label: string; href: string; Icon: typeof InstagramIcon } => Boolean(s.href));

function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/20 md:border-none">
      <button
        className="w-full flex items-center justify-between py-4 md:pointer-events-none md:pb-3"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="tracked-label text-palladio-gold">{title}</span>
        <ChevronRightIcon className={`w-4 h-4 md:hidden transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <div className={`${open ? "block" : "hidden"} md:block pb-4 md:pb-0`}>{children}</div>
    </div>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer className="bg-palladio-offwhite text-palladio-black border-t border-palladio-border">
      {/* Newsletter + Follow Us row */}
      <div id="newsletter" className="border-b border-palladio-border px-6 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="max-w-8xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="footer-email" className="tracked-label whitespace-nowrap">
              Subscribe to Our Newsletters
            </label>
            <input
              id="footer-email"
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border border-palladio-border px-3 py-2 text-sm outline-none w-full sm:w-64"
            />
            <button type="submit" className="tracked-label whitespace-nowrap hover:opacity-60 shrink-0">
              {submitted ? "Subscribed" : "Subscribe"}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="tracked-label text-palladio-grey">Follow Us</span>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 flex items-center justify-center border border-palladio-border rounded-full hover:border-black hover:opacity-80"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Link columns */}
      <div className="max-w-8xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-8">
        {footerColumns.map((col) => (
          <FooterAccordion key={col.title} title={col.title}>
            <ul className="space-y-2.5">
              {col.links.map((l) => {
                const Icon = "icon" in l ? l.icon : null;
                return (
                  <li key={l.href}>
                    <Link to={l.href} className="text-sm text-palladio-grey hover:text-black flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4" />}
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </FooterAccordion>
        ))}

        <FooterAccordion title="Find a Store">
          <ul className="space-y-2.5">
            <li>
              <Link to="/store-locator" className="text-sm text-palladio-grey hover:text-black flex items-center gap-2">
                <StoreIcon className="w-4 h-4" />
                Store Locator
              </Link>
            </li>
          </ul>
        </FooterAccordion>
      </div>

      <div className="max-w-8xl mx-auto px-6 py-6 border-t border-palladio-border text-xs text-palladio-grey flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>PALLADIO&reg; Official Website</span>
        <span>&copy; {new Date().getFullYear()} Palladio. All rights reserved.</span>
      </div>
    </footer>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Gem,
  Boxes,
  ClipboardList,
  Calculator,
  Users,
  Mail,
  Handshake,
  Inbox,
  ShoppingBag,
  Receipt,
  CalendarDays,
  BookOpen,
  Settings,
  Menu,
  X,
  Link2,
  Newspaper,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Pregled",
    items: [
      { href: "/dashboard", label: "Početna", icon: LayoutDashboard },
      { href: "/dnevnik", label: "Dnevnik", icon: BookOpen },
    ],
  },
  {
    label: "Web",
    items: [
      { href: "/blog", label: "Journal / Blog", icon: Newspaper },
    ],
  },
  {
    label: "Prodaja",
    items: [
      { href: "/upiti", label: "Upiti", icon: Inbox },
      { href: "/narudzbe", label: "Narudžbe", icon: ShoppingBag },
      { href: "/kupci", label: "Kupci", icon: Users },
      { href: "/newsletter", label: "Newsletter", icon: Mail },
      { href: "/affiliate", label: "Affiliate", icon: Handshake },
      { href: "/payment-links", label: "Payment Links", icon: Link2 },
    ],
  },
  {
    label: "Proizvodnja",
    items: [
      { href: "/proizvodi", label: "Proizvodi", icon: Gem },
      { href: "/materijali", label: "Materijali", icon: Boxes },
      { href: "/radni-nalozi", label: "Radni nalozi", icon: ClipboardList },
    ],
  },
  {
    label: "Finansije",
    items: [
      { href: "/racunovodstvo", label: "Računovodstvo", icon: Calculator },
      { href: "/fakture", label: "Dolazne fakture", icon: Receipt },
      { href: "/kalendar", label: "Kalendar", icon: CalendarDays },
    ],
  },
  {
    label: "Sistem",
    items: [{ href: "/postavke", label: "Postavke", icon: Settings }],
  },
];

function Logomark() {
  return (
    <div className="px-5 py-6 flex items-center gap-3">
      <div className="hallmark w-9 h-9 !p-0 text-sm">585</div>
      <div>
        <div className="font-display text-lg text-ink-100 leading-none">
          Zlatarnica
        </div>
        <div className="text-[11px] text-ink-400 tracking-wide uppercase">
          CRM
        </div>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-3 mb-1 text-[10px] uppercase tracking-wider text-ink-400/70">
            {group.label}
          </div>
          <div className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors border ${
                    active
                      ? "bg-gold-dim text-gold border-gold/40 shadow-sm font-medium"
                      : "text-ink-400 border-transparent hover:text-ink-100 hover:bg-ink-900"
                  }`}
                >
                  <Icon size={17} strokeWidth={1.75} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }
  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-3 py-2.5 rounded-md text-sm text-ink-400 border border-transparent hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-colors flex items-center gap-3"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Odjava
    </button>
  );
}

function StatusFooter() {
  return (
    <div className="px-3 py-4 border-t border-ink-700 space-y-1">
      <LogoutButton />
      <div className="px-3 text-[10px] text-ink-400/50">Palladio CRM</div>
    </div>
  );
}

export default function Sidebar() {
  const [otvoreno, setOtvoreno] = useState(false);
  const pathname = usePathname();

  // Always call hooks before any early return.
  useEffect(() => {
    setOtvoreno(false);
  }, [pathname]);

  if (pathname === "/login") return null;

  return (
    <>
      {/* Mobile top bar — hidden on desktop */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-ink-700 bg-ink-800 shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="hallmark w-7 h-7 !p-0 text-[11px]">585</div>
          <span className="font-display text-base text-ink-100">Zlatarnica</span>
        </div>
        <button
          onClick={() => setOtvoreno(true)}
          className="p-2 rounded-md border border-ink-700 text-ink-400"
          aria-label="Otvori meni"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {otvoreno && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-ink-100/20 backdrop-blur-[1px]"
            onClick={() => setOtvoreno(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-ink-800 shadow-card-hover flex flex-col h-full">
            <div className="flex items-center justify-between pr-4">
              <Logomark />
              <button
                onClick={() => setOtvoreno(false)}
                className="p-2 text-ink-400"
                aria-label="Zatvori meni"
              >
                <X size={18} />
              </button>
            </div>
            <NavList onNavigate={() => setOtvoreno(false)} />
            <StatusFooter />
          </aside>
        </div>
      )}

      {/* Desktop sidebar — hidden on mobile/tablet */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-ink-700 bg-ink-800 shadow-card flex-col relative z-10">
        <Logomark />
        <NavList />
        <StatusFooter />
      </aside>
    </>
  );
}

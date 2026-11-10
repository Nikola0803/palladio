/**
 * Layout za /plati/* — javne payment link stranice.
 * Bez CRM Sidebar-a, bez auth middleware-a.
 * Potpuno clean — samo Stripe fonts i body.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Palladio — Plaćanje",
  description: "Sigurno online plaćanje",
};

export default function PlatiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

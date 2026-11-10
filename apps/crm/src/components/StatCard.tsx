import { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "gold",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: "gold" | "moss" | "silver";
}) {
  const accentColor =
    accent === "moss"
      ? "text-moss"
      : accent === "silver"
      ? "text-silver"
      : "text-gold-light";

  return (
    <div className="relative overflow-hidden rounded-md border border-ink-700 bg-ink-800 shadow-card p-5 bg-facet">
      <div className="flex items-start justify-between">
        <span className="text-xs uppercase tracking-wide text-ink-400">
          {label}
        </span>
        <Icon size={16} strokeWidth={1.75} className={accentColor} />
      </div>
      <div className="mt-3 font-display text-2xl text-ink-100">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

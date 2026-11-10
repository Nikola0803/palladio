import { LucideIcon } from "lucide-react";

export default function PagePlaceholder({
  title,
  description,
  icon: Icon,
  nextSteps,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  nextSteps: string[];
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink-100">{title}</h1>
        <p className="text-ink-400 text-sm mt-1">{description}</p>
      </header>

      <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card p-6 bg-facet">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-md bg-gold/10 flex items-center justify-center">
            <Icon size={17} className="text-gold-light" strokeWidth={1.75} />
          </div>
          <span className="text-xs uppercase tracking-wide text-ink-400">
            Sljedeće za povezati
          </span>
        </div>
        <ul className="space-y-2 text-sm text-ink-100">
          {nextSteps.map((step) => (
            <li key={step} className="flex gap-2">
              <span className="text-gold">·</span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

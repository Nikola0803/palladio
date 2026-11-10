"use client";

import { useState } from "react";
import { RefreshCw, Check, X } from "lucide-react";

export default function NewsletterSync({ brojPretplacenika }: { brojPretplacenika: number }) {
  const [sinkronizuje, setSinkronizuje] = useState(false);
  const [rezultat, setRezultat] = useState<{ ok: boolean; poruka: string } | null>(null);

  async function sinkronizuj() {
    setSinkronizuje(true);
    setRezultat(null);
    const res = await fetch("/api/newsletter/sinkronizuj", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setRezultat({ ok: true, poruka: `Poslano ${data.uspjesno} od ${data.ukupno} kontakata u Brevo` });
    } else {
      setRezultat({ ok: false, poruka: data.error || "Greška pri sinkronizaciji" });
    }
    setSinkronizuje(false);
  }

  return (
    <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display text-lg text-ink-100">Brevo sinkronizacija</h3>
          <p className="text-xs text-ink-400 mt-0.5">
            {brojPretplacenika} kupaca prijavljeno na newsletter
          </p>
        </div>
        <button
          onClick={sinkronizuj}
          disabled={sinkronizuje}
          className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={sinkronizuje ? "animate-spin" : ""} />
          {sinkronizuje ? "Sinkronizacija..." : "Sinkronizuj sa Brevo"}
        </button>
      </div>
      {rezultat && (
        <div
          className={`mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-md border ${
            rezultat.ok
              ? "border-moss/40 text-moss bg-moss/10"
              : "border-rust/40 text-rust bg-rust/10"
          }`}
        >
          {rezultat.ok ? <Check size={13} /> : <X size={13} />}
          {rezultat.poruka}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Download, Check, X, Loader2 } from "lucide-react";

export default function WooUvozDugme() {
  const [ucitava, setUcitava] = useState(false);
  const [rezultat, setRezultat] = useState<{
    ok: boolean;
    proizvodi?: number;
    narudzbe?: number;
    kupci?: number;
    greske?: string[];
    error?: string;
  } | null>(null);

  async function uvezi() {
    setUcitava(true);
    setRezultat(null);
    const res = await fetch("/api/woocommerce/uvoz", { method: "POST" });
    const data = await res.json();
    setRezultat(data);
    setUcitava(false);
  }

  return (
    <div className="mt-3 pt-3 border-t border-ink-700">
      <button
        onClick={uvezi}
        disabled={ucitava}
        className="flex items-center gap-2 border border-gold/40 text-gold px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gold-dim transition-colors disabled:opacity-50"
      >
        {ucitava ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        {ucitava ? "Uvozim..." : "Uvezi proizvode, narudžbe i kupce sada"}
      </button>

      {rezultat && (
        <div
          className={`mt-3 text-xs px-3 py-2 rounded-md border ${
            rezultat.ok
              ? "border-moss/40 text-moss bg-moss/10"
              : "border-rust/40 text-rust bg-rust/10"
          }`}
        >
          {rezultat.ok ? (
            <div className="flex items-start gap-2">
              <Check size={13} className="mt-0.5 shrink-0" />
              <div>
                <div>
                  Uvezeno: {rezultat.proizvodi} proizvoda, {rezultat.narudzbe} narudžbi,{" "}
                  {rezultat.kupci} kupaca
                </div>
                {rezultat.greske && rezultat.greske.length > 0 && (
                  <div className="mt-1 text-rust">
                    {rezultat.greske.join(" · ")}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <X size={13} />
              {rezultat.error || "Greška pri uvozu"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

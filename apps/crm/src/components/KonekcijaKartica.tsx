"use client";

import { useState } from "react";
import { Check, X, Loader2, Wifi } from "lucide-react";

type Polje = { kljuc: string; label: string; tip?: "text" | "password" };

export default function KonekcijaKartica({
  naziv,
  opis,
  servisZaTest,
  polja,
  pocetneVrijednosti,
  dodatnoIspod,
}: {
  naziv: string;
  opis: string;
  servisZaTest: "wordpress" | "goldprice" | "brevo" | "woocommerce";
  polja: Polje[];
  pocetneVrijednosti: Record<string, string>;
  dodatnoIspod?: React.ReactNode;
}) {
  const [vrijednosti, setVrijednosti] = useState(pocetneVrijednosti);
  const [spremanje, setSpremanje] = useState(false);
  const [testiranje, setTestiranje] = useState(false);
  const [rezultat, setRezultat] = useState<{ ok: boolean; poruka: string } | null>(null);

  const popunjeno = polja.every((p) => vrijednosti[p.kljuc]?.trim());

  async function sacuvajSve() {
    setSpremanje(true);
    await Promise.all(
      polja.map((p) =>
        fetch("/api/postavke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kljuc: p.kljuc, vrijednost: vrijednosti[p.kljuc] ?? "" }),
        })
      )
    );
    setSpremanje(false);
    testirajVezu();
  }

  async function testirajVezu() {
    setTestiranje(true);
    setRezultat(null);
    const res = await fetch("/api/postavke/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servis: servisZaTest }),
    });
    const data = await res.json();
    setRezultat(data);
    setTestiranje(false);
  }

  return (
    <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-display text-lg text-ink-100">{naziv}</h3>
          <p className="text-xs text-ink-400 mt-0.5">{opis}</p>
        </div>
        {popunjeno && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-stamp border border-moss/40 text-moss bg-moss/10 whitespace-nowrap">
            <Check size={11} /> Podešeno
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {polja.map((p) => (
          <div key={p.kljuc}>
            <label className="block text-xs text-ink-400 mb-1">{p.label}</label>
            <input
              type={p.tip === "password" ? "password" : "text"}
              value={vrijednosti[p.kljuc] ?? ""}
              onChange={(e) =>
                setVrijednosti((v) => ({ ...v, [p.kljuc]: e.target.value }))
              }
              className="w-full bg-ink-900 border border-ink-700 rounded-md px-3 py-1.5 text-sm text-ink-100 focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={sacuvajSve}
          disabled={spremanje}
          className="bg-gold text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {spremanje ? "Čuvanje..." : "Sačuvaj i testiraj"}
        </button>
        <button
          onClick={testirajVezu}
          disabled={testiranje}
          className="flex items-center gap-1.5 border border-ink-700 text-ink-400 px-3 py-1.5 rounded-md text-xs hover:text-ink-100 hover:bg-ink-900 transition-colors disabled:opacity-50"
        >
          {testiranje ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
          Testiraj vezu
        </button>
      </div>

      {rezultat && (
        <div
          className={`mt-3 flex items-start gap-2 text-xs px-3 py-2 rounded-md border ${
            rezultat.ok
              ? "border-moss/40 text-moss bg-moss/10"
              : "border-rust/40 text-rust bg-rust/10"
          }`}
        >
          {rezultat.ok ? (
            <Check size={13} className="mt-0.5 shrink-0" />
          ) : (
            <X size={13} className="mt-0.5 shrink-0" />
          )}
          {rezultat.poruka}
        </div>
      )}

      {dodatnoIspod}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, X, Copy, Check } from "lucide-react";

type Partner = {
  id: number;
  ime: string;
  email: string;
  kodZaPracenje: string;
  provizijaPosto: number | null;
  status: string | null;
  ukupnoZaraceno: number | null;
  brojNarudzbi: number | null;
};

const STATUS_LABEL: Record<string, string> = {
  aktivan: "Aktivan",
  neaktivan: "Neaktivan",
  na_cekanju: "Na čekanju",
};

const STATUS_STYLE: Record<string, string> = {
  aktivan: "border-moss/40 text-moss bg-moss/10",
  neaktivan: "border-silver/40 text-silver bg-ink-900",
  na_cekanju: "border-rose/40 text-rose bg-rose/10",
};

export default function AffiliateClient({ pocetniPartneri }: { pocetniPartneri: Partner[] }) {
  const [partneri, setPartneri] = useState(pocetniPartneri);
  const [formaOtvorena, setFormaOtvorena] = useState(false);
  const [novi, setNovi] = useState({ ime: "", email: "", provizijaPosto: "10" });
  const [kopirano, setKopirano] = useState<number | null>(null);

  async function dodajPartnera() {
    if (!novi.ime || !novi.email) return;
    const res = await fetch("/api/affiliate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...novi, provizijaPosto: Number(novi.provizijaPosto) }),
    });
    if (res.ok) {
      const { partner } = await res.json();
      setPartneri((p) => [partner, ...p]);
      setFormaOtvorena(false);
      setNovi({ ime: "", email: "", provizijaPosto: "10" });
    }
  }

  async function promijeniStatus(id: number, status: string) {
    setPartneri((p) => p.map((x) => (x.id === id ? { ...x, status } : x)));
    await fetch("/api/affiliate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  function kopirajKod(id: number, kod: string) {
    navigator.clipboard?.writeText(kod);
    setKopirano(id);
    setTimeout(() => setKopirano(null), 1500);
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setFormaOtvorena((f) => !f)}
          className="flex items-center gap-2 bg-gold text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gold-light transition-colors shadow-card"
        >
          {formaOtvorena ? <X size={16} /> : <Plus size={16} />}
          {formaOtvorena ? "Zatvori" : "Novi partner"}
        </button>
      </div>

      {formaOtvorena && (
        <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card p-5 mb-6">
          <h3 className="font-display text-lg text-ink-100 mb-4">Novi affiliate partner</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-ink-400 mb-1">Ime</label>
              <input
                value={novi.ime}
                onChange={(e) => setNovi((s) => ({ ...s, ime: e.target.value }))}
                className="w-full bg-ink-900 border border-ink-700 rounded-md px-3 py-1.5 text-sm text-ink-100 focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-400 mb-1">Email</label>
              <input
                value={novi.email}
                onChange={(e) => setNovi((s) => ({ ...s, email: e.target.value }))}
                className="w-full bg-ink-900 border border-ink-700 rounded-md px-3 py-1.5 text-sm text-ink-100 focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-400 mb-1">Provizija (%)</label>
              <input
                type="number"
                value={novi.provizijaPosto}
                onChange={(e) => setNovi((s) => ({ ...s, provizijaPosto: e.target.value }))}
                className="w-full bg-ink-900 border border-ink-700 rounded-md px-3 py-1.5 text-sm text-ink-100 focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
          <button
            onClick={dodajPartnera}
            className="mt-4 bg-gold text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gold-light transition-colors"
          >
            Dodaj partnera
          </button>
          <p className="text-xs text-ink-400 mt-2">
            Kod za praćenje se generiše automatski. Novi partner počinje sa statusom "Na čekanju".
          </p>
        </div>
      )}

      <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-sm">
            <thead>
              <tr className="text-left text-ink-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-normal">Partner</th>
                <th className="px-5 py-3 font-normal">Kod</th>
                <th className="px-5 py-3 font-normal">Provizija</th>
                <th className="px-5 py-3 font-normal">Narudžbe</th>
                <th className="px-5 py-3 font-normal">Zarađeno</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {partneri.map((p) => (
                <tr key={p.id} className="border-t border-ink-700">
                  <td className="px-5 py-3">
                    <div className="text-ink-100">{p.ime}</div>
                    <div className="text-xs text-ink-400">{p.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => kopirajKod(p.id, p.kodZaPracenje)}
                      className="flex items-center gap-1.5 font-mono text-xs text-ink-100 hover:text-gold transition-colors"
                    >
                      {p.kodZaPracenje}
                      {kopirano === p.id ? <Check size={12} className="text-moss" /> : <Copy size={12} />}
                    </button>
                  </td>
                  <td className="px-5 py-3 font-mono text-ink-100">{p.provizijaPosto}%</td>
                  <td className="px-5 py-3 font-mono text-ink-100">{p.brojNarudzbi ?? 0}</td>
                  <td className="px-5 py-3 font-mono text-ink-100">
                    €{(p.ukupnoZaraceno ?? 0).toLocaleString("hr-HR")}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={p.status ?? "na_cekanju"}
                      onChange={(e) => promijeniStatus(p.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-stamp border bg-transparent ${STATUS_STYLE[p.status ?? "na_cekanju"]}`}
                    >
                      {Object.entries(STATUS_LABEL).map(([val, label]) => (
                        <option key={val} value={val} className="bg-ink-800 text-ink-100">
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {partneri.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-ink-400">
                    Nema partnera još.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, X, Copy, Check, FileText, Ban, Link2 } from "lucide-react";

type PaymentLink = {
  id: number;
  token: string;
  kupacIme: string | null;
  opis: string | null;
  iznos: number;
  valuta: string | null;
  status: string;
  heroImage: string | null;
  napomena: string | null;
  kreirano: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  aktivan:  "border-moss/40 text-moss bg-moss/10",
  placen:   "border-blue-500/40 text-blue-400 bg-blue-500/10",
  opozvan:  "border-silver/40 text-silver bg-ink-900",
  istekao:  "border-rose/40 text-rose bg-rose/10",
};

const STATUS_LABEL: Record<string, string> = {
  aktivan: "Aktivan",
  placen:  "Plaćen",
  opozvan: "Opozvan",
  istekao: "Istekao",
};

function money(iznos: number, valuta: string) {
  return iznos.toLocaleString("hr-HR", {
    style: "currency",
    currency: (valuta || "EUR").toUpperCase(),
    minimumFractionDigits: 2,
  });
}

const BASE_URL = process.env.NEXT_PUBLIC_CRM_URL || "";

export default function PaymentLinksClient({
  pocetniLinkovi,
}: {
  pocetniLinkovi: PaymentLink[];
}) {
  const [linkovi, setLinkovi] = useState(pocetniLinkovi);
  const [formaOtvorena, setFormaOtvorena] = useState(false);
  const [kopirano, setKopirano] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [novi, setNovi] = useState({
    kupacIme: "",
    opis: "",
    iznos: "",
    valuta: "EUR",
    napomena: "",
    heroImage: "",
  });

  async function kreirajLink() {
    if (!novi.iznos || isNaN(Number(novi.iznos))) return;
    setBusy(-1);
    const res = await fetch("/api/payment-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kupacIme:  novi.kupacIme || null,
        opis:      novi.opis || null,
        iznos:     Number(novi.iznos),
        valuta:    novi.valuta,
        napomena:  novi.napomena || null,
        heroImage: novi.heroImage || null,
      }),
    });
    if (res.ok) {
      const { paymentLink } = await res.json();
      setLinkovi((l) => [paymentLink, ...l]);
      setFormaOtvorena(false);
      setNovi({ kupacIme: "", opis: "", iznos: "", valuta: "EUR", napomena: "", heroImage: "" });
    }
    setBusy(null);
  }

  async function opoziLink(id: number) {
    if (!confirm("Opozovi ovaj payment link?")) return;
    setBusy(id);
    const res = await fetch(`/api/payment-links/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLinkovi((l) =>
        l.map((x) => (x.id === id ? { ...x, status: "opozvan" } : x))
      );
    }
    setBusy(null);
  }

  function kopirajLink(id: number, token: string) {
    const url = `${BASE_URL}/plati/${token}`;
    navigator.clipboard.writeText(url);
    setKopirano(id);
    setTimeout(() => setKopirano(null), 2000);
  }

  function otvoriInvoice(id: number) {
    window.open(`/api/payment-links/${id}/invoice`, "_blank");
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-100">Payment Links</h1>
          <p className="text-sm text-silver mt-0.5">
            Kreiraj linkove za direktno plaćanje bez narudžbe
          </p>
        </div>
        <button
          onClick={() => setFormaOtvorena(true)}
          className="flex items-center gap-2 bg-gold text-ink-950 px-4 py-2 text-sm font-medium hover:bg-gold/90 transition rounded"
        >
          <Plus className="w-4 h-4" />
          Novi link
        </button>
      </div>

      {/* Forma za novi link */}
      {formaOtvorena && (
        <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-ink-100">Novi payment link</h2>
            <button onClick={() => setFormaOtvorena(false)}>
              <X className="w-4 h-4 text-silver hover:text-ink-100" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-silver uppercase tracking-wider">Iznos *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  placeholder="0.00"
                  value={novi.iznos}
                  onChange={(e) => setNovi((n) => ({ ...n, iznos: e.target.value }))}
                  className="flex-1 bg-ink-800 border border-ink-600 text-ink-100 px-3 py-2 text-sm rounded focus:outline-none focus:border-gold"
                />
                <select
                  value={novi.valuta}
                  onChange={(e) => setNovi((n) => ({ ...n, valuta: e.target.value }))}
                  className="bg-ink-800 border border-ink-600 text-ink-100 px-3 py-2 text-sm rounded focus:outline-none focus:border-gold w-20"
                >
                  <option>EUR</option>
                  <option>USD</option>
                  <option>HRK</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-silver uppercase tracking-wider">Kupac</label>
              <input
                type="text"
                placeholder="Ime kupca (opciono)"
                value={novi.kupacIme}
                onChange={(e) => setNovi((n) => ({ ...n, kupacIme: e.target.value }))}
                className="bg-ink-800 border border-ink-600 text-ink-100 px-3 py-2 text-sm rounded focus:outline-none focus:border-gold"
              />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs text-silver uppercase tracking-wider">Opis</label>
              <input
                type="text"
                placeholder="Opis plaćanja (prikazuje se kupcu)"
                value={novi.opis}
                onChange={(e) => setNovi((n) => ({ ...n, opis: e.target.value }))}
                className="bg-ink-800 border border-ink-600 text-ink-100 px-3 py-2 text-sm rounded focus:outline-none focus:border-gold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-silver uppercase tracking-wider">Hero slika URL</label>
              <input
                type="url"
                placeholder="https://... (opciono)"
                value={novi.heroImage}
                onChange={(e) => setNovi((n) => ({ ...n, heroImage: e.target.value }))}
                className="bg-ink-800 border border-ink-600 text-ink-100 px-3 py-2 text-sm rounded focus:outline-none focus:border-gold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-silver uppercase tracking-wider">Napomena (interna)</label>
              <input
                type="text"
                placeholder="Bilješka za vas (ne vidi kupac)"
                value={novi.napomena}
                onChange={(e) => setNovi((n) => ({ ...n, napomena: e.target.value }))}
                className="bg-ink-800 border border-ink-600 text-ink-100 px-3 py-2 text-sm rounded focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={kreirajLink}
              disabled={busy === -1 || !novi.iznos}
              className="bg-gold text-ink-950 px-5 py-2 text-sm font-medium rounded hover:bg-gold/90 transition disabled:opacity-40"
            >
              {busy === -1 ? "Kreiranje..." : "Kreiraj link"}
            </button>
            <button
              onClick={() => setFormaOtvorena(false)}
              className="text-silver text-sm px-4 py-2 hover:text-ink-100 transition"
            >
              Odustani
            </button>
          </div>
        </div>
      )}

      {/* Tablica */}
      {linkovi.length === 0 ? (
        <div className="text-center py-16 text-silver">
          <Link2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nema payment linkova</p>
          <p className="text-xs mt-1 opacity-60">Klikni "Novi link" da kreiraš prvi</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-xs text-silver uppercase tracking-wider">
                <th className="text-left pb-3 pr-4">Kupac / Opis</th>
                <th className="text-right pb-3 pr-4">Iznos</th>
                <th className="text-left pb-3 pr-4">Status</th>
                <th className="text-left pb-3 pr-4">Datum</th>
                <th className="text-right pb-3">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {linkovi.map((link) => (
                <tr key={link.id} className="group">
                  <td className="py-3 pr-4">
                    <p className="text-ink-100 font-medium leading-tight">
                      {link.kupacIme || "—"}
                    </p>
                    {link.opis && (
                      <p className="text-silver text-xs mt-0.5 truncate max-w-[220px]">
                        {link.opis}
                      </p>
                    )}
                    {link.napomena && (
                      <p className="text-silver/60 text-xs mt-0.5 italic truncate max-w-[220px]">
                        {link.napomena}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right font-medium text-ink-100 tabular-nums">
                    {money(link.iznos, link.valuta || "EUR")}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs rounded border ${
                        STATUS_STYLE[link.status] ?? "border-silver/40 text-silver bg-ink-900"
                      }`}
                    >
                      {STATUS_LABEL[link.status] ?? link.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-silver text-xs">
                    {link.kreirano
                      ? new Date(link.kreirano).toLocaleDateString("hr-HR", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Kopiraj link */}
                      <button
                        onClick={() => kopirajLink(link.id, link.token)}
                        title="Kopiraj link"
                        className="p-1.5 rounded text-silver hover:text-ink-100 hover:bg-ink-700 transition"
                      >
                        {kopirano === link.id ? (
                          <Check className="w-4 h-4 text-moss" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Faktura */}
                      <button
                        onClick={() => otvoriInvoice(link.id)}
                        title="Otvori fakturu"
                        className="p-1.5 rounded text-silver hover:text-ink-100 hover:bg-ink-700 transition"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Opozovi */}
                      {link.status === "aktivan" && (
                        <button
                          onClick={() => opoziLink(link.id)}
                          disabled={busy === link.id}
                          title="Opozovi link"
                          className="p-1.5 rounded text-silver hover:text-rose hover:bg-rose/10 transition disabled:opacity-40"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

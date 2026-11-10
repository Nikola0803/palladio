"use client";

import { useState } from "react";
import { Send, Save, Check } from "lucide-react";
import ProizvodModal from "./ProizvodModal";

type Proizvod = {
  id: number;
  sifra: string;
  opis: string;
  metalCistoca: string | null;
  tezinaG: number | null;
  prodajnaCijena: number | null;
  status: string | null;
  wooProductId: number | null;
  wooSyncedAt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  na_zalihi: "Na zalihi",
  prodano: "Prodano",
  rezervirano: "Rezervirano",
};

const STATUS_STYLE: Record<string, string> = {
  na_zalihi: "border-moss/40 text-moss bg-moss/10",
  prodano: "border-silver/40 text-silver bg-ink-900",
  rezervirano: "border-rose/40 text-rose bg-rose/10",
};

/**
 * Suggested retail price = metal value at current spot (weight × €/g at the
 * product's purity) × markup. Markup is a placeholder — swap MARKUP_MULTIPLIER
 * for whatever formula the business actually uses (labour, stone cost, etc).
 */
const MARKUP_MULTIPLIER = 2.4;

function izracunajCistocu(metalCistoca: string | null): 925 | 750 | 585 | null {
  if (!metalCistoca) return null;
  if (metalCistoca.includes("925")) return 925;
  if (metalCistoca.includes("750")) return 750;
  if (metalCistoca.includes("585")) return 585;
  return null;
}

export default function ProizvodiTable({
  proizvodi,
  cijenaZlata,
}: {
  proizvodi: Proizvod[];
  cijenaZlata: {
    cijenaEurPoGramu925: number | null;
    cijenaEurPoGramu750: number | null;
    cijenaEurPoGramu585: number | null;
  } | null;
}) {
  const [izmjene, setIzmjene] = useState<Record<number, number>>({});
  const [spremanje, setSpremanje] = useState<Record<number, "spremanje" | "poslato" | null>>({});
  const [otvorenId, setOtvorenId] = useState<number | null>(null);

  function predlozenaCijena(p: Proizvod): number | null {
    if (!cijenaZlata || !p.tezinaG) return null;
    const cistoca = izracunajCistocu(p.metalCistoca);
    const cijenaPoGramu =
      cistoca === 925
        ? cijenaZlata.cijenaEurPoGramu925
        : cistoca === 750
        ? cijenaZlata.cijenaEurPoGramu750
        : cistoca === 585
        ? cijenaZlata.cijenaEurPoGramu585
        : null;
    if (!cijenaPoGramu) return null;
    return Math.round(p.tezinaG * cijenaPoGramu * MARKUP_MULTIPLIER * 100) / 100;
  }

  async function sacuvaj(p: Proizvod, posaljiUWoo: boolean) {
    const novaCijena = izmjene[p.id] ?? p.prodajnaCijena ?? 0;
    setSpremanje((s) => ({ ...s, [p.id]: "spremanje" }));
    const res = await fetch("/api/proizvodi/reprice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, cijena: novaCijena, posaljiUWoo }),
    });
    setSpremanje((s) => ({ ...s, [p.id]: res.ok ? "poslato" : null }));
    setTimeout(() => setSpremanje((s) => ({ ...s, [p.id]: null })), 2000);
  }

  return (
    <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="text-left text-ink-400 text-xs uppercase tracking-wide">
            <th className="px-5 py-3 font-normal w-24">Šifra</th>
            <th className="px-5 py-3 font-normal min-w-[220px]">Opis</th>
            <th className="px-5 py-3 font-normal w-24">Metal</th>
            <th className="px-5 py-3 font-normal w-20">Težina</th>
            <th className="px-5 py-3 font-normal w-32">Predložena cijena</th>
            <th className="px-5 py-3 font-normal w-40">Prodajna cijena</th>
            <th className="px-5 py-3 font-normal w-28">Status</th>
            <th className="px-5 py-3 font-normal w-24">Woo</th>
            <th className="px-5 py-3 font-normal w-20"></th>
          </tr>
        </thead>
        <tbody>
          {proizvodi.map((p) => {
            const predlog = predlozenaCijena(p);
            const trenutnaVrijednost = izmjene[p.id] ?? p.prodajnaCijena ?? 0;
            const stanje = spremanje[p.id];

            return (
              <tr
                key={p.id}
                onClick={() => setOtvorenId(p.id)}
                className="border-t border-ink-700 hover:bg-ink-900/50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3 font-mono text-ink-100">{p.sifra}</td>
                <td className="px-5 py-3 text-ink-100">{p.opis}</td>
                <td className="px-5 py-3">
                  <span className="hallmark">{p.metalCistoca}</span>
                </td>
                <td className="px-5 py-3 font-mono text-ink-100">
                  {p.tezinaG} g
                </td>
                <td className="px-5 py-3 font-mono text-ink-400">
                  {predlog ? `€${predlog.toLocaleString("hr-HR")}` : "—"}
                </td>
                <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <span className="text-ink-400">€</span>
                    <input
                      type="number"
                      className="w-24 bg-ink-900 border border-ink-700 rounded-md px-2 py-1 font-mono text-ink-100 focus:outline-none focus:ring-1 focus:ring-gold"
                      value={trenutnaVrijednost}
                      onChange={(e) =>
                        setIzmjene((izm) => ({
                          ...izm,
                          [p.id]: Number(e.target.value),
                        }))
                      }
                    />
                    {predlog && predlog !== trenutnaVrijednost && (
                      <button
                        onClick={() =>
                          setIzmjene((izm) => ({ ...izm, [p.id]: predlog }))
                        }
                        className="text-xs text-gold hover:underline whitespace-nowrap"
                      >
                        koristi predlog
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-stamp border ${
                      STATUS_STYLE[p.status ?? "na_zalihi"]
                    }`}
                  >
                    {STATUS_LABEL[p.status ?? "na_zalihi"]}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-ink-400">
                  {p.wooSyncedAt
                    ? new Date(p.wooSyncedAt).toLocaleDateString("hr-HR")
                    : p.wooProductId
                    ? "nije poslano"
                    : "nije povezano"}
                </td>
                <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => sacuvaj(p, false)}
                      className="p-1.5 rounded-md border border-ink-700 text-ink-400 hover:text-ink-100 hover:bg-ink-900 transition-colors"
                      title="Sačuvaj u CRM-u"
                    >
                      {stanje === "poslato" ? (
                        <Check size={14} className="text-moss" />
                      ) : (
                        <Save size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => sacuvaj(p, true)}
                      disabled={!p.wooProductId}
                      className="p-1.5 rounded-md border border-gold/40 text-gold hover:bg-gold-dim transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Sačuvaj i pošalji u Woo"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {proizvodi.length === 0 && (
            <tr>
              <td colSpan={9} className="px-5 py-6 text-center text-ink-400">
                Nema gotovih proizvoda još.
              </td>
            </tr>
          )}
        </tbody>
      </table></div>

      {otvorenId && (
        <ProizvodModal
          proizvodId={otvorenId}
          onClose={() => setOtvorenId(null)}
          onSacuvano={() => {}}
        />
      )}
    </div>
  );
}

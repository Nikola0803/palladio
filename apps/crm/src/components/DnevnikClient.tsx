"use client";

import { useMemo, useState } from "react";
import { Check, PenLine } from "lucide-react";

type Zapis = { id: number; datum: string; sadrzaj: string; azuriran: string };

const DANI_U_SEDMICI = [
  "nedjelja", "ponedjeljak", "utorak", "srijeda",
  "četvrtak", "petak", "subota",
];

function formatDatumPuno(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const dan = DANI_U_SEDMICI[d.getDay()];
  const [g, m, dd] = iso.split("-");
  return `${dan}, ${dd}.${m}.${g}.`;
}

export default function DnevnikClient({
  pocetniZapisi,
  kompaktno = false,
}: {
  pocetniZapisi: Zapis[];
  kompaktno?: boolean;
}) {
  const [zapisi, setZapisi] = useState(pocetniZapisi);
  const danas = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [odabraniDatum, setOdabraniDatum] = useState(danas);
  const postojeciZapis = zapisi.find((z) => z.datum === odabraniDatum);
  const [tekst, setTekst] = useState(postojeciZapis?.sadrzaj ?? "");
  const [spremljeno, setSpremljeno] = useState(false);

  function odaberiDatum(datum: string) {
    setOdabraniDatum(datum);
    setTekst(zapisi.find((z) => z.datum === datum)?.sadrzaj ?? "");
    setSpremljeno(false);
  }

  async function sacuvaj() {
    if (!tekst.trim()) return;
    const res = await fetch("/api/dnevnik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datum: odabraniDatum, sadrzaj: tekst }),
    });
    if (res.ok) {
      setZapisi((prev) => {
        const bezStarog = prev.filter((z) => z.datum !== odabraniDatum);
        return [
          { id: 0, datum: odabraniDatum, sadrzaj: tekst, azuriran: new Date().toISOString() },
          ...bezStarog,
        ].sort((a, b) => (a.datum < b.datum ? 1 : -1));
      });
      setSpremljeno(true);
      setTimeout(() => setSpremljeno(false), 2000);
    }
  }

  return (
    <div className={kompaktno ? "" : "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"}>
      <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PenLine size={15} className="text-gold" strokeWidth={1.75} />
            <span className="text-sm font-medium text-ink-100 capitalize">
              {formatDatumPuno(odabraniDatum)}
            </span>
          </div>
          {!kompaktno && (
            <input
              type="date"
              value={odabraniDatum}
              max={danas}
              onChange={(e) => odaberiDatum(e.target.value)}
              className="text-xs bg-ink-900 border border-ink-700 rounded-md px-2 py-1 text-ink-100"
            />
          )}
        </div>
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder="Šta si radio danas, kakvi su bili problemi (ljevanje, itd.)..."
          rows={kompaktno ? 3 : 6}
          className="w-full bg-ink-900 border border-ink-700 rounded-md px-3 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-gold resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-ink-400">
            {postojeciZapis ? "Uređuješ postojeći zapis" : "Novi zapis"}
          </span>
          <button
            onClick={sacuvaj}
            className="flex items-center gap-1.5 bg-gold text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gold-light transition-colors"
          >
            {spremljeno ? <Check size={13} /> : null}
            {spremljeno ? "Sačuvano" : "Sačuvaj"}
          </button>
        </div>
      </div>

      {!kompaktno && (
        <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card overflow-hidden max-h-[480px] overflow-y-auto">
          <div className="px-4 py-3 border-b border-ink-700 sticky top-0 bg-ink-800">
            <span className="text-xs uppercase tracking-wide text-ink-400">
              Ranije bilješke
            </span>
          </div>
          {zapisi.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-ink-400">
              Nema zapisa još.
            </div>
          )}
          {zapisi.map((z) => (
            <button
              key={z.datum}
              onClick={() => odaberiDatum(z.datum)}
              className={`w-full text-left px-4 py-3 border-b border-ink-700 last:border-b-0 transition-colors ${
                z.datum === odabraniDatum
                  ? "bg-gold-dim"
                  : "hover:bg-ink-900"
              }`}
            >
              <div className="text-xs font-medium text-ink-100 capitalize">
                {formatDatumPuno(z.datum)}
              </div>
              <div className="text-xs text-ink-400 mt-0.5 line-clamp-2">
                {z.sadrzaj}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

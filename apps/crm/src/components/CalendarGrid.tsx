"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Dogadjaj = {
  datum: string; // YYYY-MM-DD
  naslov: string;
  tip: "faktura" | "radni_nalog" | "ostalo";
  zavrseno: boolean;
};

const DANI = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];
const MJESECI = [
  "Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
  "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac",
];

const TIP_BOJA: Record<Dogadjaj["tip"], string> = {
  faktura: "bg-rust",
  radni_nalog: "bg-gold",
  ostalo: "bg-silver",
};

export default function CalendarGrid({ dogadjaji }: { dogadjaji: Dogadjaj[] }) {
  const [pomak, setPomak] = useState(0);

  const { godina, mjesec, dani, praznaPolja } = useMemo(() => {
    const danas = new Date();
    const referenca = new Date(danas.getFullYear(), danas.getMonth() + pomak, 1);
    const godina = referenca.getFullYear();
    const mjesec = referenca.getMonth();
    const brojDana = new Date(godina, mjesec + 1, 0).getDate();
    const prviDanIndex = (new Date(godina, mjesec, 1).getDay() + 6) % 7; // ponedjeljak = 0

    return {
      godina,
      mjesec,
      dani: Array.from({ length: brojDana }, (_, i) => i + 1),
      praznaPolja: Array.from({ length: prviDanIndex }),
    };
  }, [pomak]);

  const dogadjajiPoDanu = useMemo(() => {
    const map: Record<string, Dogadjaj[]> = {};
    for (const d of dogadjaji) {
      (map[d.datum] ??= []).push(d);
    }
    return map;
  }, [dogadjaji]);

  const danasStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700">
        <h2 className="font-display text-lg text-ink-100">
          {MJESECI[mjesec]} {godina}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setPomak((p) => p - 1)}
            className="p-1.5 rounded-md border border-ink-700 text-ink-400 hover:text-ink-100 hover:bg-ink-900 transition-colors"
            aria-label="Prethodni mjesec"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPomak((p) => p + 1)}
            className="p-1.5 rounded-md border border-ink-700 text-ink-400 hover:text-ink-100 hover:bg-ink-900 transition-colors"
            aria-label="Sljedeći mjesec"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-ink-700">
        {DANI.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-xs uppercase tracking-wide text-ink-400"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {praznaPolja.map((_, i) => (
          <div key={`prazno-${i}`} className="border-b border-r border-ink-700 min-h-24" />
        ))}
        {dani.map((dan) => {
          const datumStr = `${godina}-${String(mjesec + 1).padStart(2, "0")}-${String(dan).padStart(2, "0")}`;
          const dogadjajiDana = dogadjajiPoDanu[datumStr] ?? [];
          const jeDanas = datumStr === danasStr;

          return (
            <div
              key={dan}
              className={`border-b border-r border-ink-700 min-h-24 p-2 ${
                jeDanas ? "bg-gold-dim" : ""
              }`}
            >
              <span
                className={`text-xs ${
                  jeDanas
                    ? "text-gold font-medium"
                    : "text-ink-400"
                }`}
              >
                {dan}
              </span>
              <div className="mt-1 space-y-1">
                {dogadjajiDana.slice(0, 3).map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-[11px] text-ink-100 truncate"
                    title={d.naslov}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${TIP_BOJA[d.tip]}`}
                    />
                    <span className="truncate">{d.naslov}</span>
                  </div>
                ))}
                {dogadjajiDana.length > 3 && (
                  <div className="text-[11px] text-ink-400">
                    +{dogadjajiDana.length - 3} više
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

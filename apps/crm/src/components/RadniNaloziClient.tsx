"use client";

import { useState } from "react";
import { Plus, X, CheckCircle2, AlertTriangle } from "lucide-react";

type Nalog = {
  id: number;
  brojNaloga: string;
  datumPocetka: string;
  datumZavrsetka: string | null;
  opisProizvoda: string;
  metal: string | null;
  utrosenoG: number | null;
  status: string | null;
  potrebniMaterijali: string | null;
  izvorNarudzbaId: number | null;
};

const STATUS_LABEL: Record<string, string> = {
  u_izradi: "U izradi",
  zavrseno: "Završeno",
  otkazano: "Otkazano",
};

const STATUS_STYLE: Record<string, string> = {
  u_izradi: "border-rose/40 text-rose bg-rose/10",
  zavrseno: "border-moss/40 text-moss bg-moss/10",
  otkazano: "border-silver/40 text-silver bg-ink-900",
};

export default function RadniNaloziClient({ pocetniNalozi }: { pocetniNalozi: Nalog[] }) {
  const [nalozi, setNalozi] = useState(pocetniNalozi);
  const [formaOtvorena, setFormaOtvorena] = useState(false);
  const [zavrsavanjeId, setZavrsavanjeId] = useState<number | null>(null);

  const [novi, setNovi] = useState({
    brojNaloga: "",
    opisProizvoda: "",
    vrstaMetala: "Au",
    cistoca: "585",
    utrosenoG: "",
    kamenjeOpis: "",
    potrosniMaterijalOpis: "",
  });

  const [zavrsi, setZavrsi] = useState({
    sifraGotovog: "",
    tezinaGotovogG: "",
    otpadG: "",
    nabavnaVrijednost: "",
  });

  async function kreirajNalog() {
    if (!novi.brojNaloga || !novi.opisProizvoda || !novi.utrosenoG) return;
    const res = await fetch("/api/radni-nalozi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...novi, cistoca: Number(novi.cistoca), utrosenoG: Number(novi.utrosenoG) }),
    });
    if (res.ok) {
      const { nalog } = await res.json();
      setNalozi((n) => [nalog, ...n]);
      setFormaOtvorena(false);
      setNovi({
        brojNaloga: "",
        opisProizvoda: "",
        vrstaMetala: "Au",
        cistoca: "585",
        utrosenoG: "",
        kamenjeOpis: "",
        potrosniMaterijalOpis: "",
      });
    }
  }

  async function zavrsiNalog(id: number) {
    if (!zavrsi.sifraGotovog || !zavrsi.tezinaGotovogG) return;
    const res = await fetch("/api/radni-nalozi/zavrsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        sifraGotovog: zavrsi.sifraGotovog,
        tezinaGotovogG: Number(zavrsi.tezinaGotovogG),
        otpadG: zavrsi.otpadG ? Number(zavrsi.otpadG) : null,
        nabavnaVrijednost: zavrsi.nabavnaVrijednost ? Number(zavrsi.nabavnaVrijednost) : null,
      }),
    });
    if (res.ok) {
      setNalozi((n) => n.map((x) => (x.id === id ? { ...x, status: "zavrseno" } : x)));
      setZavrsavanjeId(null);
      setZavrsi({ sifraGotovog: "", tezinaGotovogG: "", otpadG: "", nabavnaVrijednost: "" });
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setFormaOtvorena((f) => !f)}
          className="flex items-center gap-2 bg-gold text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gold-light transition-colors shadow-card"
        >
          {formaOtvorena ? <X size={16} /> : <Plus size={16} />}
          {formaOtvorena ? "Zatvori" : "Novi nalog"}
        </button>
      </div>

      {formaOtvorena && (
        <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card p-5 mb-6">
          <h3 className="font-display text-lg text-ink-100 mb-4">Novi radni nalog</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Polje label="Broj naloga" value={novi.brojNaloga} onChange={(v) => setNovi((s) => ({ ...s, brojNaloga: v }))} placeholder="RN-014" />
            <Polje label="Opis proizvoda" value={novi.opisProizvoda} onChange={(v) => setNovi((s) => ({ ...s, opisProizvoda: v }))} placeholder="Vjenčani prsten" />
            <Polje label="Metal" value={novi.vrstaMetala} onChange={(v) => setNovi((s) => ({ ...s, vrstaMetala: v }))} placeholder="Au" />
            <Polje label="Čistoća" value={novi.cistoca} onChange={(v) => setNovi((s) => ({ ...s, cistoca: v }))} placeholder="585" />
            <Polje label="Utrošeno (g)" value={novi.utrosenoG} onChange={(v) => setNovi((s) => ({ ...s, utrosenoG: v }))} placeholder="4.2" tip="number" />
            <Polje label="Kamenje (opis)" value={novi.kamenjeOpis} onChange={(v) => setNovi((s) => ({ ...s, kamenjeOpis: v }))} placeholder="Opciono" />
          </div>
          <button
            onClick={kreirajNalog}
            className="mt-4 bg-gold text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gold-light transition-colors"
          >
            Sačuvaj nalog
          </button>
          <p className="text-xs text-ink-400 mt-2">
            Ovo automatski upisuje "izlaz" u evidenciju sirovina za utrošenu količinu.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {nalozi.map((n) => (
          <div key={n.id} className="rounded-md border border-ink-700 bg-ink-800 shadow-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-ink-100">{n.brojNaloga}</span>
                <span className="text-sm text-ink-100">{n.opisProizvoda}</span>
                {n.metal && <span className="hallmark">{n.metal}</span>}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-stamp border ${STATUS_STYLE[n.status ?? "u_izradi"]}`}
              >
                {STATUS_LABEL[n.status ?? "u_izradi"]}
              </span>
            </div>
            <div className="text-xs text-ink-400 mt-1.5">
              Počeo {n.datumPocetka}
              {n.utrosenoG ? ` · utrošeno ${n.utrosenoG} g` : ""}
            </div>

            {n.potrebniMaterijali && (
              <div className="mt-2 flex items-start gap-2 bg-rose/10 border border-rose/30 rounded-md px-3 py-2">
                <AlertTriangle size={13} className="text-rose mt-0.5 shrink-0" />
                <div className="text-xs text-rose">
                  <span className="font-medium">Nedostaje: </span>
                  {n.potrebniMaterijali}
                  {n.izvorNarudzbaId && (
                    <span className="text-ink-400"> — automatski iz porudžbine</span>
                  )}
                </div>
              </div>
            )}

            {n.status === "u_izradi" && zavrsavanjeId !== n.id && (
              <button
                onClick={() => setZavrsavanjeId(n.id)}
                className="mt-3 flex items-center gap-1.5 text-xs text-gold hover:underline"
              >
                <CheckCircle2 size={13} /> Završi nalog
              </button>
            )}

            {zavrsavanjeId === n.id && (
              <div className="mt-3 pt-3 border-t border-ink-700 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Polje label="Šifra gotovog" value={zavrsi.sifraGotovog} onChange={(v) => setZavrsi((s) => ({ ...s, sifraGotovog: v }))} placeholder="GT-103" />
                <Polje label="Težina gotovog (g)" value={zavrsi.tezinaGotovogG} onChange={(v) => setZavrsi((s) => ({ ...s, tezinaGotovogG: v }))} placeholder="4.0" tip="number" />
                <Polje label="Otpad (g)" value={zavrsi.otpadG} onChange={(v) => setZavrsi((s) => ({ ...s, otpadG: v }))} placeholder="0.2" tip="number" />
                <Polje label="Nabavna vrijednost (€)" value={zavrsi.nabavnaVrijednost} onChange={(v) => setZavrsi((s) => ({ ...s, nabavnaVrijednost: v }))} placeholder="235" tip="number" />
                <div className="sm:col-span-2 flex gap-2">
                  <button
                    onClick={() => zavrsiNalog(n.id)}
                    className="bg-moss text-white px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Potvrdi završetak
                  </button>
                  <button
                    onClick={() => setZavrsavanjeId(null)}
                    className="border border-ink-700 text-ink-400 px-3 py-1.5 rounded-md text-xs hover:text-ink-100 transition-colors"
                  >
                    Otkaži
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {nalozi.length === 0 && (
          <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card p-6 text-center text-sm text-ink-400">
            Nema radnih naloga još.
          </div>
        )}
      </div>
    </div>
  );
}

function Polje({
  label,
  value,
  onChange,
  placeholder,
  tip = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tip?: "text" | "number";
}) {
  return (
    <div>
      <label className="block text-xs text-ink-400 mb-1">{label}</label>
      <input
        type={tip}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-ink-900 border border-ink-700 rounded-md px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-400/60 focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </div>
  );
}

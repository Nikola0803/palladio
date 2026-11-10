"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, Save, Check, ExternalLink } from "lucide-react";

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
  wooSirovoJson: string | null;
};

type Materijal = {
  id: number;
  tip: string;
  naziv: string;
  potrebnaKolicina: number;
  jedinica: string;
};

const TIP_LABEL: Record<string, string> = {
  zlato: "Zlato",
  srebro: "Srebro",
  platina: "Platina",
  dijamant: "Dijamant",
  cirkon: "Cirkon",
  kamenje: "Kamenje (ostalo)",
  ostalo: "Ostalo",
};

export default function ProizvodModal({
  proizvodId,
  onClose,
  onSacuvano,
}: {
  proizvodId: number;
  onClose: () => void;
  onSacuvano: (p: Proizvod) => void;
}) {
  const [ucitava, setUcitava] = useState(true);
  const [proizvod, setProizvod] = useState<Proizvod | null>(null);
  const [materijali, setMaterijali] = useState<Materijal[]>([]);
  const [spremanje, setSpremanje] = useState<"idle" | "spremanje" | "sacuvano">("idle");

  const [noviMaterijal, setNoviMaterijal] = useState({
    tip: "zlato",
    naziv: "",
    potrebnaKolicina: "",
    jedinica: "g",
  });

  useEffect(() => {
    fetch(`/api/proizvodi/detalji?id=${proizvodId}`)
      .then((r) => r.json())
      .then((data) => {
        setProizvod(data.proizvod);
        setMaterijali(data.materijali);
        setUcitava(false);
      });
  }, [proizvodId]);

  async function sacuvajProizvod() {
    if (!proizvod) return;
    setSpremanje("spremanje");
    const res = await fetch("/api/proizvodi/azuriraj", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: proizvod.id,
        opis: proizvod.opis,
        sifra: proizvod.sifra,
        prodajnaCijena: proizvod.prodajnaCijena,
        status: proizvod.status,
        tezinaG: proizvod.tezinaG,
        metalCistoca: proizvod.metalCistoca,
      }),
    });
    if (res.ok) {
      setSpremanje("sacuvano");
      onSacuvano(proizvod);
      setTimeout(() => setSpremanje("idle"), 1500);
    } else {
      setSpremanje("idle");
    }
  }

  async function dodajMaterijal() {
    if (!noviMaterijal.naziv || !noviMaterijal.potrebnaKolicina) return;
    const res = await fetch("/api/proizvodi/materijali", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proizvodId,
        tip: noviMaterijal.tip,
        naziv: noviMaterijal.naziv,
        potrebnaKolicina: Number(noviMaterijal.potrebnaKolicina),
        jedinica: noviMaterijal.jedinica,
      }),
    });
    if (res.ok) {
      const { stavka } = await res.json();
      setMaterijali((m) => [...m, stavka]);
      setNoviMaterijal({ tip: "zlato", naziv: "", potrebnaKolicina: "", jedinica: "g" });
    }
  }

  async function obrisiMaterijal(id: number) {
    setMaterijali((m) => m.filter((x) => x.id !== id));
    await fetch(`/api/proizvodi/materijali?id=${id}`, { method: "DELETE" });
  }

  const wooPodaci = proizvod?.wooSirovoJson ? JSON.parse(proizvod.wooSirovoJson) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-100/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-ink-800 w-full sm:max-w-2xl sm:rounded-md shadow-card-hover h-full sm:h-auto sm:max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-ink-800 border-b border-ink-700 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-display text-lg text-ink-100">
            {ucitava ? "Učitavanje..." : proizvod?.opis}
          </h2>
          <button onClick={onClose} className="p-1.5 text-ink-400 hover:text-ink-100" aria-label="Zatvori">
            <X size={18} />
          </button>
        </div>

        {!ucitava && proizvod && (
          <div className="p-5 space-y-6">
            {/* Osnovni podaci */}
            <section>
              <h3 className="text-xs uppercase tracking-wide text-ink-400 mb-2">Osnovni podaci</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Polje label="Šifra" value={proizvod.sifra} onChange={(v) => setProizvod({ ...proizvod, sifra: v })} />
                <Polje label="Status" tipPolja="select" value={proizvod.status ?? "na_zalihi"} onChange={(v) => setProizvod({ ...proizvod, status: v })} opcije={[["na_zalihi", "Na zalihi"], ["prodano", "Prodano"], ["rezervirano", "Rezervirano"]]} />
                <div className="sm:col-span-2">
                  <Polje label="Opis" value={proizvod.opis} onChange={(v) => setProizvod({ ...proizvod, opis: v })} />
                </div>
                <Polje label="Metal + čistoća" value={proizvod.metalCistoca ?? ""} onChange={(v) => setProizvod({ ...proizvod, metalCistoca: v })} placeholder="Au 585" />
                <Polje label="Težina (g)" tip="number" value={String(proizvod.tezinaG ?? "")} onChange={(v) => setProizvod({ ...proizvod, tezinaG: Number(v) })} />
                <Polje label="Prodajna cijena (€)" tip="number" value={String(proizvod.prodajnaCijena ?? "")} onChange={(v) => setProizvod({ ...proizvod, prodajnaCijena: Number(v) })} />
              </div>
              <button
                onClick={sacuvajProizvod}
                disabled={spremanje === "spremanje"}
                className="mt-3 flex items-center gap-2 bg-gold text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                {spremanje === "sacuvano" ? <Check size={13} /> : <Save size={13} />}
                {spremanje === "sacuvano" ? "Sačuvano" : "Sačuvaj izmjene"}
              </button>
            </section>

            {/* Materijali (BOM) */}
            <section className="pt-4 border-t border-ink-700">
              <h3 className="text-xs uppercase tracking-wide text-ink-400 mb-2">
                Potrebni materijali za izradu (po komadu)
              </h3>
              <p className="text-xs text-ink-400 mb-3">
                Ovo se koristi za automatsku provjeru zaliha kad stigne porudžbina — ako nešto nedostaje, radni nalog se kreira automatski.
              </p>

              <div className="space-y-1.5 mb-3">
                {materijali.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-ink-900 border border-ink-700 rounded-md px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="hallmark">{TIP_LABEL[m.tip] ?? m.tip}</span>
                      <span className="text-ink-100">{m.naziv}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-ink-400">
                        {m.potrebnaKolicina} {m.jedinica}
                      </span>
                      <button onClick={() => obrisiMaterijal(m.id)} className="text-rust hover:opacity-70" aria-label="Obriši">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {materijali.length === 0 && (
                  <div className="text-sm text-ink-400 py-3 text-center">Nema definisanih materijala još.</div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                <div className="col-span-1">
                  <label className="block text-xs text-ink-400 mb-1">Tip</label>
                  <select
                    value={noviMaterijal.tip}
                    onChange={(e) => setNoviMaterijal((s) => ({ ...s, tip: e.target.value }))}
                    className="w-full bg-ink-900 border border-ink-700 rounded-md px-2 py-1.5 text-sm text-ink-100"
                  >
                    {Object.entries(TIP_LABEL).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs text-ink-400 mb-1">Naziv (npr. "Au 585")</label>
                  <input
                    value={noviMaterijal.naziv}
                    onChange={(e) => setNoviMaterijal((s) => ({ ...s, naziv: e.target.value }))}
                    className="w-full bg-ink-900 border border-ink-700 rounded-md px-2 py-1.5 text-sm text-ink-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-400 mb-1">Količina</label>
                  <input
                    type="number"
                    value={noviMaterijal.potrebnaKolicina}
                    onChange={(e) => setNoviMaterijal((s) => ({ ...s, potrebnaKolicina: e.target.value }))}
                    className="w-full bg-ink-900 border border-ink-700 rounded-md px-2 py-1.5 text-sm text-ink-100"
                  />
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={noviMaterijal.jedinica}
                    onChange={(e) => setNoviMaterijal((s) => ({ ...s, jedinica: e.target.value }))}
                    className="w-full bg-ink-900 border border-ink-700 rounded-md px-2 py-1.5 text-sm text-ink-100"
                  >
                    <option value="g">g</option>
                    <option value="kom">kom</option>
                    <option value="ct">ct</option>
                  </select>
                  <button
                    onClick={dodajMaterijal}
                    className="shrink-0 p-1.5 bg-gold text-white rounded-md hover:bg-gold-light transition-colors"
                    aria-label="Dodaj materijal"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </section>

            {/* Woo podaci (raw) */}
            {wooPodaci && (
              <section className="pt-4 border-t border-ink-700">
                <h3 className="text-xs uppercase tracking-wide text-ink-400 mb-2">
                  Podaci sa WooCommerce sajta
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <InfoRed label="SKU" value={wooPodaci.sku || "—"} />
                  <InfoRed label="Status zalihe" value={wooPodaci.stock_status} />
                  <InfoRed label="Regularna cijena" value={wooPodaci.regular_price ? `€${wooPodaci.regular_price}` : "—"} />
                  <InfoRed label="Akcijska cijena" value={wooPodaci.sale_price ? `€${wooPodaci.sale_price}` : "—"} />
                  <InfoRed label="Kategorije" value={(wooPodaci.categories ?? []).map((c: { name: string }) => c.name).join(", ") || "—"} />
                  <InfoRed label="Težina (Woo)" value={wooPodaci.weight || "—"} />
                  <InfoRed label="Dimenzije" value={[wooPodaci.dimensions?.length, wooPodaci.dimensions?.width, wooPodaci.dimensions?.height].filter(Boolean).join(" × ") || "—"} />
                  <InfoRed label="Ukupno prodano" value={String(wooPodaci.total_sales ?? "—")} />
                </div>
                {wooPodaci.permalink && (
                  <a
                    href={wooPodaci.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
                  >
                    Otvori na sajtu <ExternalLink size={12} />
                  </a>
                )}
              </section>
            )}
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
  tipPolja = "input",
  opcije,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tip?: "text" | "number";
  tipPolja?: "input" | "select";
  opcije?: [string, string][];
}) {
  return (
    <div>
      <label className="block text-xs text-ink-400 mb-1">{label}</label>
      {tipPolja === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-ink-900 border border-ink-700 rounded-md px-3 py-1.5 text-sm text-ink-100"
        >
          {opcije?.map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      ) : (
        <input
          type={tip}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-ink-900 border border-ink-700 rounded-md px-3 py-1.5 text-sm text-ink-100 focus:outline-none focus:ring-1 focus:ring-gold"
        />
      )}
    </div>
  );
}

function InfoRed({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-ink-400">{label}: </span>
      <span className="text-ink-100">{value}</span>
    </div>
  );
}

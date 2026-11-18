"use client";

import { useState } from "react";
import { RefreshCw, Check, X, Loader2, Image } from "lucide-react";

type SyncResult = {
  ok: boolean;
  upserted: number;
  pagesProcessed: number;
  totalPages: number;
  hasMore: boolean;
  nextPage: number | null;
  errors: string[];
  error?: string;
};

export default function KatalogSinkronizacija() {
  const [running, setRunning] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  async function sinkronizuj() {
    setRunning(true);
    setDone(false);
    setFailed(false);
    setLog([]);

    let totalUpserted = 0;
    let page = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const url = `/api/catalog/sync?per_page=50&page_limit=5${page > 1 ? `&page=${page}` : ""}`;
      let data: SyncResult;
      try {
        const res = await fetch(url, { method: "POST" });
        data = await res.json();
      } catch (e) {
        setLog((l) => [...l, `Greška pri dohvatu: ${e instanceof Error ? e.message : "nepoznato"}`]);
        setFailed(true);
        break;
      }

      if (!data.ok) {
        setLog((l) => [...l, `Greška: ${data.error || "nepoznato"}`]);
        setFailed(true);
        break;
      }

      totalUpserted += data.upserted;
      setLog((l) => [
        ...l,
        `Stranice ${data.pagesProcessed}/${data.totalPages} — ${totalUpserted} proizvoda uvezeno`,
      ]);

      if (!data.hasMore) {
        setDone(true);
        break;
      }
      page = data.nextPage ?? page + 5;
    }

    setRunning(false);
  }

  async function migrirajSlike() {
    setMigrating(true);
    let remaining = 1;
    let migratedTotal = 0;

    while (remaining > 0) {
      let data: { ok: boolean; remaining: number; imagesUploaded: number; errors: string[]; error?: string };
      try {
        const res = await fetch("/api/migracija/slike?batch=20", { method: "POST" });
        data = await res.json();
      } catch {
        setLog((l) => [...l, "Migracija slika: greška mreže"]);
        break;
      }
      if (!data.ok) {
        setLog((l) => [...l, `Migracija slika: ${data.error || "greška"}`]);
        break;
      }
      migratedTotal += data.imagesUploaded;
      remaining = data.remaining;
      setLog((l) => [...l, `Slike: ${migratedTotal} migrirano, ${remaining} preostalo`]);
    }

    if (remaining === 0) {
      setLog((l) => [...l, `✓ Sve slike migrirane na Vercel Blob`]);
    }
    setMigrating(false);
  }

  return (
    <div className="mt-3 pt-3 border-t border-ink-700 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={sinkronizuj}
          disabled={running || migrating}
          className="flex items-center gap-2 border border-sky-500/40 text-sky-400 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-sky-500/10 transition-colors disabled:opacity-50"
        >
          {running ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {running ? "Sinkronizujem katalog..." : "Sinkronizuj katalog (web shop)"}
        </button>

        {done && (
          <button
            onClick={migrirajSlike}
            disabled={migrating}
            className="flex items-center gap-2 border border-purple-500/40 text-purple-400 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-purple-500/10 transition-colors disabled:opacity-50"
          >
            {migrating ? <Loader2 size={13} className="animate-spin" /> : <Image size={13} />}
            {migrating ? "Migriram slike..." : "Migrira slike na Vercel Blob"}
          </button>
        )}
      </div>

      {log.length > 0 && (
        <div className={`text-xs px-3 py-2 rounded-md border font-mono space-y-0.5 ${
          failed
            ? "border-rust/40 text-rust bg-rust/10"
            : done
            ? "border-moss/40 text-moss bg-moss/10"
            : "border-gold/30 text-gold bg-gold-dim"
        }`}>
          {log.map((line, i) => (
            <div key={i} className="flex items-start gap-1.5">
              {done && i === log.length - 1 && !failed ? <Check size={11} className="mt-0.5 shrink-0" /> : null}
              {failed && i === log.length - 1 ? <X size={11} className="mt-0.5 shrink-0" /> : null}
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-500">
        Sinkronizacija vuče sve objavljene WooCommerce proizvode u CRM bazu podataka koja napaja web shop.
        Pokreni jednom za inicijalni uvoz, pa ponovo kad dodaš nove proizvode na WordPress.
      </p>
    </div>
  );
}

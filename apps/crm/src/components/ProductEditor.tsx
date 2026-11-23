"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { products } from "@/lib/db/schema";

type Product = typeof products.$inferSelect;

function parseImages(images: string | null) {
  try {
    const result = images ? JSON.parse(images) : [];
    return Array.isArray(result) ? result.filter((image): image is string => typeof image === "string") : [];
  } catch {
    return [];
  }
}

export default function ProductEditor({ product }: { product: Product }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: product.name, slug: product.slug || "", sku: product.sku || "",
    shortDescription: product.shortDescription || "", description: product.description || "",
    categories: product.categories || "", regularPrice: product.regularPrice?.toString() || "",
    salePrice: product.salePrice?.toString() || "", published: product.published ?? true,
    images: parseImages(product.images).join("\n"),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (field: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));
  const input = "mt-1 w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-ink-100 outline-none focus:border-gold";
  const label = "block text-sm font-medium text-ink-200";

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, images: form.images.split(/\r?\n/).map((image) => image.trim()).filter(Boolean) }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Greška pri spremanju proizvoda."); setSaving(false); return;
    }
    router.push("/proizvodi"); router.refresh();
  }

  return <form onSubmit={save} className="max-w-5xl p-4 sm:p-6 lg:p-8">
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs uppercase tracking-wide text-gold">Katalog proizvoda</p><h1 className="mt-1 font-display text-3xl text-ink-100">Uredi proizvod</h1><p className="mt-1 text-sm text-ink-400">ID #{product.id}</p></div>
      <div className="flex gap-3"><button type="button" onClick={() => router.push("/proizvodi")} className="rounded-md border border-ink-600 px-4 py-2 text-sm text-ink-200">Odustani</button><button disabled={saving} className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink-900 disabled:opacity-60">{saving ? "Spremanje…" : "Spremi promjene"}</button></div>
    </header>
    {error && <p className="mb-5 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-5 rounded-md border border-ink-700 bg-ink-800 p-5 shadow-card"><h2 className="font-display text-xl text-ink-100">Osnovno</h2>
        <label className={label}>Naziv<input required value={form.name} onChange={(e) => set("name", e.target.value)} className={input} /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Slug<input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={input} /></label><label className={label}>SKU<input value={form.sku} onChange={(e) => set("sku", e.target.value)} className={input} /></label></div>
        <label className={label}>Kategorije <span className="font-normal text-ink-400">(zarezom)</span><input value={form.categories} onChange={(e) => set("categories", e.target.value)} className={input} /></label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-200"><input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 accent-gold" /> Prikazuj proizvod na sajtu</label>
      </section>
      <section className="space-y-5 rounded-md border border-ink-700 bg-ink-800 p-5 shadow-card"><h2 className="font-display text-xl text-ink-100">Cijene</h2>
        <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Redovna cijena (€)<input inputMode="decimal" value={form.regularPrice} onChange={(e) => set("regularPrice", e.target.value)} className={input} /></label><label className={label}>Akcijska cijena (€)<input inputMode="decimal" value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} className={input} /></label></div>
        <p className="text-sm text-ink-400">Ostavi akcijsku cijenu praznom ako proizvod nije na akciji.</p>
      </section>
    </div>
    <section className="mt-6 space-y-5 rounded-md border border-ink-700 bg-ink-800 p-5 shadow-card"><h2 className="font-display text-xl text-ink-100">Opis</h2><label className={label}>Kratki opis<textarea value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} rows={3} className={input} /></label><label className={label}>Puni opis<textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={10} className={input} /></label></section>
    <section className="mt-6 space-y-3 rounded-md border border-ink-700 bg-ink-800 p-5 shadow-card"><h2 className="font-display text-xl text-ink-100">Slike</h2><p className="text-sm text-ink-400">Jedan URL slike po retku. Prva slika je glavna slika proizvoda.</p><textarea value={form.images} onChange={(e) => set("images", e.target.value)} rows={8} className={input} placeholder="https://…" /><div className="flex flex-wrap gap-3">{form.images.split(/\r?\n/).map((url) => url.trim()).filter(Boolean).map((url) => <img key={url} src={url} alt="Pregled proizvoda" className="h-20 w-20 rounded object-cover bg-ink-900" />)}</div></section>
  </form>;
}

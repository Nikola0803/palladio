"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

interface PostData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  authorName: string;
  published: boolean;
}

interface Props {
  title: string;
  initial?: Partial<PostData>;
  saving: boolean;
  error: string;
  onSave: (data: PostData) => void;
  onCancel: () => void;
}

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/[šš]/g, "s")
    .replace(/[žž]/g, "z")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function PostEditor({ title, initial, saving, error, onSave, onCancel }: Props) {
  const [slug, setSlug] = useState(initial?.slug || "");
  const [postTitle, setPostTitle] = useState(initial?.title || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [content, setContent] = useState(initial?.content || "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage || "");
  const [authorName, setAuthorName] = useState(initial?.authorName || "Palladio");
  const [published, setPublished] = useState(initial?.published || false);
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);

  useEffect(() => {
    if (!slugTouched && postTitle) {
      setSlug(toSlug(postTitle));
    }
  }, [postTitle, slugTouched]);

  function handleSave(pub: boolean) {
    onSave({ slug, title: postTitle, excerpt, content, featuredImage, authorName, published: pub });
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="p-1.5 rounded text-ink-400 hover:text-ink-100 hover:bg-ink-700 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-display text-ink-100">{title}</h1>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-xs text-ink-400 uppercase tracking-wide mb-1.5">Naslov *</label>
          <input
            type="text"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            placeholder="Naslov objave"
            className="w-full px-3 py-2 bg-ink-900 border border-ink-600 rounded-md text-ink-100 placeholder-ink-500 text-sm focus:outline-none focus:border-gold/50"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-400 uppercase tracking-wide mb-1.5">Slug (URL)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            placeholder="url-objave"
            className="w-full px-3 py-2 bg-ink-900 border border-ink-600 rounded-md text-ink-100 placeholder-ink-500 text-sm font-mono focus:outline-none focus:border-gold/50"
          />
          <p className="text-xs text-ink-500 mt-1">palladio.hr/blog/{slug || "url-objave"}</p>
        </div>

        <div>
          <label className="block text-xs text-ink-400 uppercase tracking-wide mb-1.5">Kratki opis (excerpt)</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Kratki opis koji se prikazuje na listi objava…"
            className="w-full px-3 py-2 bg-ink-900 border border-ink-600 rounded-md text-ink-100 placeholder-ink-500 text-sm resize-y focus:outline-none focus:border-gold/50"
          />
        </div>

        <div>
          <label className="block text-xs text-ink-400 uppercase tracking-wide mb-1.5">Sadržaj (HTML)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder={"<p>Tekst objave…</p>\n\n<p>Možeš koristiti HTML tagove: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;h2&gt;, &lt;img&gt;, &lt;a&gt;</p>"}
            className="w-full px-3 py-2 bg-ink-900 border border-ink-600 rounded-md text-ink-100 placeholder-ink-500 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:border-gold/50"
          />
          <p className="text-xs text-ink-500 mt-1">HTML format — koristi &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;h2&gt;, &lt;img src=""&gt;, &lt;a href=""&gt;</p>
        </div>

        <div>
          <label className="block text-xs text-ink-400 uppercase tracking-wide mb-1.5">Naslovna slika (URL)</label>
          <input
            type="url"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="https://…"
            className="w-full px-3 py-2 bg-ink-900 border border-ink-600 rounded-md text-ink-100 placeholder-ink-500 text-sm focus:outline-none focus:border-gold/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-400 uppercase tracking-wide mb-1.5">Autor</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 bg-ink-900 border border-ink-600 rounded-md text-ink-100 text-sm focus:outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-400 uppercase tracking-wide mb-1.5">Status</label>
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-sm text-ink-300">Objavljeno</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-ink-700">
          <button
            onClick={() => handleSave(published)}
            disabled={saving || !postTitle || !slug}
            className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium bg-gold text-ink-900 hover:bg-gold/90 disabled:opacity-40 transition-colors"
          >
            <Save size={15} />
            {saving ? "Čuvanje…" : published ? "Spremi i objavi" : "Spremi nacrt"}
          </button>
          {!published && (
            <button
              onClick={() => { setPublished(true); handleSave(true); }}
              disabled={saving || !postTitle || !slug}
              className="px-5 py-2 rounded-md text-sm font-medium border border-gold/40 text-gold hover:bg-gold/10 disabled:opacity-40 transition-colors"
            >
              Objavi odmah
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm text-ink-400 hover:text-ink-100 transition-colors"
          >
            Odustani
          </button>
        </div>
      </div>
    </div>
  );
}

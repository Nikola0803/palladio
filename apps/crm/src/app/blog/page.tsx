"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  published: boolean;
  publishedAt: string | null;
  kreirano: string | null;
  authorName: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/blog/posts?per_page=50");
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(post: Post) {
    await fetch(`/api/blog/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...post, published: !post.published }),
    });
    await load();
  }

  async function deletePost(id: number) {
    setDeleting(id);
    await fetch(`/api/blog/posts/${id}`, { method: "DELETE" });
    setDeleting(null);
    await load();
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display text-ink-100">Journal</h1>
          <p className="text-sm text-ink-400 mt-0.5">Blog objave — uredjivanje i objava</p>
        </div>
        <Link
          href="/blog/new"
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-gold text-ink-900 hover:bg-gold/90 transition-colors"
        >
          <PlusCircle size={16} />
          Nova objava
        </Link>
      </div>

      {loading ? (
        <p className="text-ink-400 text-sm py-12 text-center">Učitavanje…</p>
      ) : posts.length === 0 ? (
        <div className="border border-ink-700 rounded-lg p-12 text-center">
          <p className="text-ink-400 text-sm mb-4">Nema objava još</p>
          <Link href="/blog/new" className="text-gold text-sm hover:underline">
            Napiši prvu objavu →
          </Link>
        </div>
      ) : (
        <div className="border border-ink-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-ink-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Naslov</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-ink-700/50 hover:bg-ink-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-ink-100 font-medium">{post.title}</div>
                    <div className="text-ink-400 text-xs mt-0.5">/blog/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                      post.published
                        ? "bg-green-400/10 text-green-400 border border-green-400/20"
                        : "bg-ink-700 text-ink-400 border border-ink-600"
                    }`}>
                      {post.published ? "Objavljeno" : "Nacrt"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-400">
                    {formatDate(post.publishedAt || post.kreirano)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => togglePublish(post)}
                        title={post.published ? "Vrati u nacrt" : "Objavi"}
                        className="p-1.5 rounded text-ink-400 hover:text-ink-100 hover:bg-ink-700 transition-colors"
                      >
                        {post.published ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <Link
                        href={`/blog/${post.id}`}
                        className="p-1.5 rounded text-ink-400 hover:text-ink-100 hover:bg-ink-700 transition-colors"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Obriši "${post.title}"?`)) deletePost(post.id);
                        }}
                        disabled={deleting === post.id}
                        className="p-1.5 rounded text-ink-400 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
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

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PostEditor from "../PostEditor";

export default function EditPostPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<object | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load full post data (including drafts) from admin API
    fetch(`/api/blog/posts?per_page=50`)
      .then((r) => r.json())
      .then((posts: Array<{ id: number } & Record<string, unknown>>) => {
        const post = posts.find((p) => p.id === parseInt(id));
        if (post) setInitial(post);
      });
  }, [id]);

  async function handleSave(data: object) {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/blog/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/blog");
    } else {
      const j = await res.json();
      setError(j.error || "Greška pri čuvanju");
      setSaving(false);
    }
  }

  if (!initial) {
    return <div className="p-6 text-ink-400 text-sm">Učitavanje…</div>;
  }

  return (
    <PostEditor
      title="Uredi objavu"
      initial={initial as Parameters<typeof PostEditor>[0]["initial"]}
      saving={saving}
      error={error}
      onSave={handleSave}
      onCancel={() => router.push("/blog")}
    />
  );
}

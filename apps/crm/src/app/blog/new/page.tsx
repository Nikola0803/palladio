"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PostEditor from "../PostEditor";

export default function NewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(data: object) {
    setSaving(true);
    setError("");
    const res = await fetch("/api/blog/posts", {
      method: "POST",
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

  return (
    <PostEditor
      title="Nova objava"
      saving={saving}
      error={error}
      onSave={handleSave}
      onCancel={() => router.push("/blog")}
    />
  );
}

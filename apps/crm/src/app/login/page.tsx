"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Greška pri prijavi");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Greška servera");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="text-center mb-10">
          <span className="text-white text-2xl tracking-[0.3em] uppercase font-light">
            Palladio
          </span>
          <p className="text-[#666] text-xs mt-1 tracking-widest uppercase">CRM</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#888] mb-1.5 tracking-wide uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm px-4 py-3 rounded-lg outline-none focus:border-[#555] transition-colors placeholder:text-[#444]"
              placeholder="admin@palladio.hr"
            />
          </div>

          <div>
            <label className="block text-xs text-[#888] mb-1.5 tracking-wide uppercase">
              Lozinka
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm px-4 py-3 rounded-lg outline-none focus:border-[#555] transition-colors placeholder:text-[#444]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black text-sm font-medium py-3 rounded-lg hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Prijavljivanje..." : "Prijava"}
          </button>
        </form>
      </div>
    </div>
  );
}

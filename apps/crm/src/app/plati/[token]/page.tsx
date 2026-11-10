/**
 * /plati/[token] — customer-facing payment link page
 * Rendered by Next.js CRM app — no WordPress involved.
 * Public page, no auth required.
 */
"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = PK ? loadStripe(PK) : null;

interface IntentData {
  client_secret: string;
  amount: number;
  currency: string;
  customer_name: string;
  description: string;
  hero_image: string;
}

function money(minor: number, currency: string) {
  return (minor / 100).toLocaleString("hr-HR", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

function PayForm({ intent, token }: { intent: IntentData; token: string }) {
  const stripe   = useStripe();
  const elements = useElements();
  const router   = useRouter();
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    setBusy(true);

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message || "Greška.");
      setBusy(false);
      return;
    }

    const returnUrl = `${window.location.origin}/plati/${token}/hvala`;
    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      clientSecret: intent.client_secret,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (confirmErr) {
      setError(confirmErr.message || "Greška plaćanja.");
      setBusy(false);
    } else {
      router.push(`/plati/${token}/hvala`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-stone-200 p-4 bg-white rounded">
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["apple_pay", "google_pay", "card"],
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !stripe}
        className="w-full bg-stone-900 text-white py-3 px-6 text-sm tracking-widest uppercase hover:bg-stone-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Obrada plaćanja...
          </span>
        ) : `Plati ${money(intent.amount, intent.currency)}`}
      </button>

      <p className="text-xs text-stone-400 text-center flex items-center justify-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        Sigurno plaćanje putem Stripe
      </p>
    </form>
  );
}

export default function PlatiPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [intent,    setIntent]    = useState<IntentData | null>(null);
  const [initError, setInitError] = useState("");

  useEffect(() => {
    fetch("/api/stripe/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setIntent(data);
      })
      .catch((err) => setInitError(err.message || "Greška učitavanja linka."));
  }, [token]);

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm">Stripe nije konfiguriran.</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-4xl">⚠️</p>
          <p className="font-medium text-stone-800">Link nije dostupan</p>
          <p className="text-sm text-stone-500">{initError}</p>
        </div>
      </div>
    );
  }

  if (!intent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-stone-100 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white shadow-sm rounded-lg overflow-hidden">
        {intent.hero_image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={intent.hero_image}
              alt={intent.description}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-xs tracking-widest text-stone-400 uppercase mb-2">Palladio</p>
            <h1 className="text-xl font-light text-stone-800 leading-snug">
              {intent.description || "Plaćanje"}
            </h1>
            {intent.customer_name && (
              <p className="text-sm text-stone-500 mt-1">za {intent.customer_name}</p>
            )}
            <p className="mt-4 text-4xl font-light text-stone-900 tracking-tight">
              {money(intent.amount, intent.currency)}
            </p>
          </div>

          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: intent.client_secret,
              locale: "hr",
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary:    "#1c1917",
                  colorBackground: "#ffffff",
                  colorText:       "#1c1917",
                  colorDanger:     "#dc2626",
                  fontFamily:      "inherit",
                  borderRadius:    "4px",
                },
                rules: {
                  ".Input": { border: "1px solid #e7e5e4", padding: "10px 12px", fontSize: "14px", boxShadow: "none" },
                  ".Input:focus": { border: "1px solid #1c1917", boxShadow: "none", outline: "none" },
                  ".Label": { fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#78716c" },
                  ".Tab": { border: "1px solid #e7e5e4", boxShadow: "none" },
                  ".Tab--selected": { border: "1px solid #1c1917" },
                },
              },
            }}
          >
            <PayForm intent={intent} token={token} />
          </Elements>
        </div>
      </div>
    </div>
  );
}

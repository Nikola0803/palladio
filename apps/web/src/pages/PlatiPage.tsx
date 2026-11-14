import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";

const PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const CRM_URL = (import.meta.env.VITE_CRM_URL || "https://crm.palladio.hr").replace(/^﻿/, "").replace(/\/+$/, "");

const stripePromise = PK ? loadStripe(PK) : null;

function money(cents: number, currency: string) {
  return (cents / 100).toLocaleString("hr-HR", {
    style: "currency",
    currency: currency.toUpperCase() || "EUR",
  });
}

interface IntentData {
  client_secret: string;
  amount: number;
  currency: string;
  customer_name: string;
  description: string;
  hero_image?: string;
}

function PayForm({ data }: { data: IntentData }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showExpressCheckout, setShowExpressCheckout] = useState(false);

  async function confirmPay() {
    if (!stripe || !elements) return;
    setError("");
    setBusy(true);

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message || "Greška u podacima plaćanja.");
      setBusy(false);
      return;
    }

    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      clientSecret: data.client_secret,
      confirmParams: { return_url: window.location.href + "?success=1" },
      redirect: "if_required",
    });

    if (stripeErr) {
      setError(stripeErr.message || "Greška pri plaćanju.");
      setBusy(false);
    } else {
      setDone(true);
    }
  }

  async function handleExpressConfirm(event: StripeExpressCheckoutElementConfirmEvent) {
    if (!stripe) return;
    const { error: stripeErr } = await stripe.confirmPayment({
      elements: elements!,
      clientSecret: data.client_secret,
      confirmParams: { return_url: window.location.href + "?success=1" },
      redirect: "if_required",
    });
    if (stripeErr) {
      event.paymentFailed({ reason: "fail" });
      setError(stripeErr.message || "Greška pri plaćanju.");
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto mb-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="bv-title md:text-[22px] mb-3">Plaćanje uspješno</h2>
        <p className="text-palladio-grey text-sm">Hvala vam. Potvrda je poslana na vašu e-adresu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.hero_image && (
        <img src={data.hero_image} alt="" className="w-full h-48 object-cover rounded" />
      )}

      <div className="bg-[#f6f5f2] p-5">
        <div className="flex justify-between items-start gap-4">
          <div>
            {data.customer_name && (
              <p className="tracked-label text-[11px] text-palladio-grey mb-1">Za: {data.customer_name}</p>
            )}
            {data.description && (
              <p className="text-sm text-palladio-text">{data.description}</p>
            )}
          </div>
          <span className="text-xl font-medium shrink-0">
            {money(data.amount, data.currency)}
          </span>
        </div>
      </div>

      {/* Apple Pay / Google Pay */}
      <div>
        <ExpressCheckoutElement
          onConfirm={handleExpressConfirm}
          onReady={({ availablePaymentMethods }) => {
            setShowExpressCheckout(
              !!(availablePaymentMethods?.applePay || availablePaymentMethods?.googlePay)
            );
          }}
          options={{
            buttonHeight: 48,
            paymentMethods: { applePay: "auto", googlePay: "auto", link: "never" },
          }}
        />
        {showExpressCheckout && (
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-palladio-border" />
            <span className="text-xs text-palladio-grey">ili plati karticom</span>
            <div className="flex-1 h-px bg-palladio-border" />
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); confirmPay(); }} className="space-y-4">
        <div className="border border-palladio-border p-4 bg-white">
          <PaymentElement options={{ layout: "tabs", wallets: { applePay: "never", googlePay: "never" } }} />
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
          className="btn-solid w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Obrađujem…
            </span>
          ) : `Plati ${money(data.amount, data.currency)}`}
        </button>

        <p className="text-xs text-palladio-grey text-center flex items-center justify-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          Sigurno plaćanje putem Stripe
        </p>
      </form>
    </div>
  );
}

export default function PlatiPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<IntentData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    // Check for success redirect from Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1" || params.get("payment_intent_client_secret")) {
      setData({ client_secret: "", amount: 0, currency: "eur", customer_name: "", description: "" });
      return;
    }
    fetch(`${CRM_URL}/api/stripe/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err) => setError(err.message || "Link nije dostupan."));
  }, [token]);

  if (error) {
    return (
      <section className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="text-palladio-grey text-sm">{error}</p>
      </section>
    );
  }

  if (!stripePromise) {
    return (
      <section className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="text-red-500 text-sm">Stripe nije konfiguriran.</p>
      </section>
    );
  }

  // Success state (returned from Stripe redirect)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("success") === "1" || urlParams.get("payment_intent")) {
    return (
      <section className="max-w-md mx-auto px-6 py-24 text-center">
        <svg className="w-16 h-16 mx-auto mb-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="bv-title md:text-[22px] mb-3">Plaćanje uspješno</h2>
        <p className="text-palladio-grey text-sm">Hvala vam. Potvrda je poslana na vašu e-adresu.</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="max-w-md mx-auto px-6 py-24">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-palladio-offwhite animate-pulse rounded" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <p className="tracked-label text-[11px] text-palladio-grey mb-2">PALLADIO</p>
        <h1 className="bv-title md:text-[22px]">Plaćanje</h1>
      </div>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: data.client_secret,
          locale: "hr",
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary:    "#1a1a1a",
              colorBackground: "#ffffff",
              colorText:       "#1a1a1a",
              colorDanger:     "#e53935",
              fontFamily:      "inherit",
              borderRadius:    "0px",
              spacingUnit:     "4px",
            },
            rules: {
              ".Input": { border: "1px solid #d9d6cf", padding: "10px 12px", fontSize: "14px", boxShadow: "none" },
              ".Input:focus": { border: "1px solid #1a1a1a", boxShadow: "none", outline: "none" },
              ".Label": { fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b6b6b", marginBottom: "4px" },
              ".Tab": { border: "1px solid #d9d6cf", boxShadow: "none" },
              ".Tab--selected": { border: "1px solid #1a1a1a" },
            },
          },
        }}
      >
        <PayForm data={data} />
      </Elements>
    </section>
  );
}

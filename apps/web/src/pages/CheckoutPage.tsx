import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import type { StripePaymentElementOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import { getCart } from "../lib/store-api";
import { placeOrder, createPaymentIntent, type BillingAddress } from "../lib/checkout-api";

const PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = PK ? loadStripe(PK) : null;

function money(minor: string | number, unit: number, code: string) {
  return (Number(minor) / 10 ** unit).toLocaleString(undefined, {
    style: "currency",
    currency: code,
  });
}

interface Fields {
  first_name: string; last_name: string;
  email: string;      phone: string;
  address_1: string;  city: string;
  postcode: string;   country: string;
  note: string;
}
const EMPTY: Fields = {
  first_name: "", last_name: "", email: "", phone: "",
  address_1: "", city: "", postcode: "", country: "HR", note: "",
};

function Field({
  label, name, type = "text", value, onChange, required = false,
}: {
  label: string; name: keyof Fields; type?: string;
  value: string; onChange: (n: keyof Fields, v: string) => void; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="tracked-label text-[11px] text-palladio-grey">{label}{required && " *"}</label>
      <input
        type={type} name={name} value={value} required={required}
        onChange={(e) => onChange(name, e.target.value)}
        className="border border-palladio-border px-3 py-2.5 text-sm focus:outline-none focus:border-palladio-text w-full bg-white"
      />
    </div>
  );
}

type CartData = Awaited<ReturnType<typeof getCart>>;

// ── PaymentElement form (needs Stripe context) ─────────────────────────────
function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [cart,   setCart]   = useState<CartData | null>(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    getCart().then(setCart).catch(() => setError("Greška učitavanja košarice."));
  }, []);

  function change(name: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [name]: value }));
  }

  const billing: BillingAddress = {
    first_name: fields.first_name,
    last_name:  fields.last_name,
    email:      fields.email,
    phone:      fields.phone,
    address_1:  fields.address_1,
    city:       fields.city,
    postcode:   fields.postcode,
    country:    fields.country,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !cart) return;

    setError("");
    setBusy(true);

    // Validate Stripe fields first
    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message || "Greška u podacima plaćanja.");
      setBusy(false);
      return;
    }

    try {
      // 1. Kreiraj WC narudžbu
      const order = await placeOrder({
        billing_address:  billing,
        shipping_address: billing,
        payment_method:   "palladio_stripe",
        customer_note:    fields.note,
      });

      // 2. Potvrdi plaćanje s PaymentElement
      const returnUrl = `${window.location.origin}/order-received/${order.order_id}?key=${order.order_key}`;
      const { error: stripeErr } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              name:    `${fields.first_name} ${fields.last_name}`.trim(),
              email:   fields.email,
              phone:   fields.phone,
              address: {
                line1:       fields.address_1,
                city:        fields.city,
                postal_code: fields.postcode,
                country:     fields.country,
              },
            },
          },
        },
        redirect: "if_required",
      });

      if (stripeErr) throw new Error(stripeErr.message || "Stripe greška.");

      navigate(`/order-received/${order.order_id}?key=${order.order_key}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Greška pri plaćanju.");
      setBusy(false);
    }
  }

  const totalCents = cart ? Number(cart.totals.total_price) : 0;
  const minorUnit  = cart?.totals.currency_minor_unit ?? 2;
  const currCode   = cart?.totals.currency_code ?? "EUR";

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs",
    paymentMethodOrder: ["apple_pay", "google_pay", "card"],
    defaultValues: {
      billingDetails: {
        name:    `${fields.first_name} ${fields.last_name}`.trim() || undefined,
        email:   fields.email || undefined,
        phone:   fields.phone || undefined,
        address: {
          country: fields.country,
        },
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16">

        {/* ── Left column ── */}
        <div className="space-y-10">

          {/* Contact */}
          <section>
            <h2 className="tracked-label text-[11px] mb-5 pb-3 border-b border-palladio-border">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" name="first_name" value={fields.first_name} onChange={change} required />
              <Field label="Last Name"  name="last_name"  value={fields.last_name}  onChange={change} required />
              <Field label="Email"      name="email"  type="email" value={fields.email} onChange={change} required />
              <Field label="Phone"      name="phone"  type="tel"   value={fields.phone} onChange={change} />
            </div>
          </section>

          {/* Shipping address */}
          <section>
            <h2 className="tracked-label text-[11px] mb-5 pb-3 border-b border-palladio-border">
              Shipping Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Street Address" name="address_1" value={fields.address_1} onChange={change} required />
              </div>
              <Field label="City"        name="city"     value={fields.city}     onChange={change} required />
              <Field label="Postal Code" name="postcode" value={fields.postcode} onChange={change} required />
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="tracked-label text-[11px] text-palladio-grey">Country *</label>
                <select
                  value={fields.country}
                  onChange={(e) => change("country", e.target.value)}
                  className="border border-palladio-border px-3 py-2.5 text-sm focus:outline-none focus:border-palladio-text bg-white"
                >
                  {COUNTRIES.map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="tracked-label text-[11px] text-palladio-grey">Order Note</label>
                <textarea
                  rows={3} value={fields.note}
                  onChange={(e) => change("note", e.target.value)}
                  className="border border-palladio-border px-3 py-2.5 text-sm focus:outline-none focus:border-palladio-text resize-none bg-white"
                />
              </div>
            </div>
          </section>

          {/* Payment — Stripe PaymentElement handles everything */}
          <section>
            <h2 className="tracked-label text-[11px] mb-5 pb-3 border-b border-palladio-border">
              Payment
            </h2>
            <div className="border border-palladio-border p-4 bg-white">
              <PaymentElement options={paymentElementOptions} />
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </section>
        </div>

        {/* ── Right column: order summary ── */}
        <aside className="self-start lg:sticky lg:top-32">
          <div className="bg-[#f6f5f2] p-6">
            <h2 className="tracked-label text-[11px] mb-5 pb-3 border-b border-palladio-border">
              Order Summary
            </h2>

            {cart?.items.map((item: CartData["items"][0]) => (
              <div key={item.key} className="flex justify-between text-sm mb-3 gap-3">
                <span className="text-palladio-grey leading-snug">
                  {item.name}
                  <span className="opacity-60 ml-1">× {item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">
                  {money(item.totals.line_total, item.totals.currency_minor_unit, currCode)}
                </span>
              </div>
            ))}

            {!cart && (
              <div className="space-y-2 mb-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-4 bg-palladio-border/40 animate-pulse rounded" />
                ))}
              </div>
            )}

            <div className="border-t border-palladio-border mt-5 pt-5 flex justify-between">
              <span className="tracked-label text-[11px]">Total</span>
              <span className="font-medium">
                {cart ? money(totalCents, minorUnit, currCode) : "—"}
              </span>
            </div>
            <p className="text-xs text-palladio-grey mt-1 mb-6">Taxes included. Shipping calculated at checkout.</p>

            <button
              type="submit"
              disabled={busy || !stripe || !cart || cart.items.length === 0}
              className="btn-solid w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Processing…
                </span>
              ) : cart ? `Pay ${money(totalCents, minorUnit, currCode)}` : "Pay"}
            </button>

            <p className="text-xs text-palladio-grey mt-4 text-center flex items-center justify-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Secured by Stripe
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
}

// ── Outer wrapper: fetches PaymentIntent client_secret, then renders Elements ──
export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState("");

  useEffect(() => {
    getCart()
      .then(async (c) => {
        const totalCents = Number(c.totals.total_price);
        const currency   = c.totals.currency_code.toLowerCase();
        if (totalCents < 50) return;
        const { client_secret } = await createPaymentIntent(totalCents, currency, 0);
        setClientSecret(client_secret);
      })
      .catch(() => setInitError("Greška pri učitavanju checkout-a. Osvježi stranicu."));
  }, []);

  if (!stripePromise) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-red-500 text-sm">Stripe nije konfiguriran. Dodaj VITE_STRIPE_PUBLISHABLE_KEY u .env</p>
      </section>
    );
  }

  if (initError) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-red-500 text-sm">{initError}</p>
      </section>
    );
  }


  return (
    <>
      <Breadcrumbs items={[
        { label: "Home",         href: "/" },
        { label: "Shopping Bag", href: "/cart" },
        { label: "Checkout" },
      ]} />

      <section className="max-w-5xl mx-auto px-6 py-10 md:py-16">
        <h1 className="bv-title md:text-[22px] text-center mb-12">Checkout</h1>

        {!clientSecret ? (
          /* Loading skeleton */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16">
            <div className="space-y-6">
              {[140, 220, 180].map((h, i) => (
                <div key={i} className="h-[${h}px] bg-palladio-offwhite animate-pulse rounded" style={{ height: h }} />
              ))}
            </div>
            <div className="h-64 bg-palladio-offwhite animate-pulse rounded" />
          </div>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              locale: "en",
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary:       "#1a1a1a",
                  colorBackground:    "#ffffff",
                  colorText:          "#1a1a1a",
                  colorDanger:        "#e53935",
                  fontFamily:         "inherit",
                  borderRadius:       "0px",
                  spacingUnit:        "4px",
                },
                rules: {
                  ".Input": {
                    border:      "1px solid #d9d6cf",
                    padding:     "10px 12px",
                    fontSize:    "14px",
                    boxShadow:   "none",
                  },
                  ".Input:focus": {
                    border:    "1px solid #1a1a1a",
                    boxShadow: "none",
                    outline:   "none",
                  },
                  ".Label": {
                    fontSize:      "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color:         "#6b6b6b",
                    marginBottom:  "4px",
                  },
                  ".Tab": {
                    border:    "1px solid #d9d6cf",
                    boxShadow: "none",
                  },
                  ".Tab--selected": {
                    border: "1px solid #1a1a1a",
                  },
                },
              },
            }}
          >
            <CheckoutForm clientSecret={clientSecret} />
          </Elements>
        )}
      </section>
    </>
  );
}

const COUNTRIES: [string, string][] = [
  ["HR", "Croatia"],          ["US", "United States"],    ["GB", "United Kingdom"],
  ["DE", "Germany"],          ["AT", "Austria"],          ["FR", "France"],
  ["IT", "Italy"],            ["ES", "Spain"],            ["NL", "Netherlands"],
  ["BE", "Belgium"],          ["CH", "Switzerland"],      ["SE", "Sweden"],
  ["NO", "Norway"],           ["DK", "Denmark"],          ["FI", "Finland"],
  ["PL", "Poland"],           ["CZ", "Czech Republic"],   ["SK", "Slovakia"],
  ["HU", "Hungary"],          ["RO", "Romania"],          ["BG", "Bulgaria"],
  ["RS", "Serbia"],           ["BA", "Bosnia"],           ["SI", "Slovenia"],
  ["ME", "Montenegro"],       ["MK", "North Macedonia"],  ["AU", "Australia"],
  ["CA", "Canada"],           ["AE", "UAE"],              ["SG", "Singapore"],
];

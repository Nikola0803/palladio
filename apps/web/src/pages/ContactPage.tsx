import { useState, type FormEvent } from "react";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import { crmUrl } from "../lib/env";

// Subjects relevant to an actual streetwear/custom-jewelry shop — not
// Bvlgari's "book a virtual appointment" style luxury-boutique language.
const SUBJECTS = [
  "General Inquiry",
  "Custom Order / Design Request",
  "Order Status",
  "Repairs & Resizing",
  "Returns & Exchanges",
  "Wholesale / Collaboration",
  "Other",
];

const TITLES = ["Mr.", "Ms.", "Mx."];

// Kept short and realistic rather than a fabricated 200-country dropdown —
// Croatia first since palladio.hr is the storefront, plus the neighboring
// markets a streetwear brand like this would actually ship to.
const COUNTRIES = [
  "Croatia",
  "Serbia",
  "Bosnia and Herzegovina",
  "Slovenia",
  "Montenegro",
  "North Macedonia",
  "Germany",
  "Austria",
  "Italy",
  "Other",
];

interface FormState {
  title: string;
  subject: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  message: string;
  consent: boolean;
}

const initialState: FormState = {
  title: TITLES[0],
  subject: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: COUNTRIES[0],
  message: "",
  consent: false,
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.consent) return;
    setStatus("sending");
    try {
      const response = await fetch(`${crmUrl(import.meta.env.VITE_CRM_URL)}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Kontakt forma nije poslana.");
      setStatus("sent");
      setForm(initialState);
    } catch {
      setStatus("error");
    }
  }

  const inputClass =
    "w-full border border-palladio-border bg-white px-4 py-3 text-sm outline-none focus:border-black placeholder:text-palladio-grey";
  const labelClass = "tracked-label text-xs mb-2 block";

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />

      <section className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        <h1 className="bv-title md:text-[22px] text-center mb-12">Contact Us</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label className={labelClass}>Title *</label>
            <select
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className={inputClass}
            >
              {TITLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Subject *</label>
            <select
              required
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select Subject
              </option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>First Name *</label>
            <input
              required
              type="text"
              placeholder="Insert Name"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="row-span-2">
            <label className={labelClass}>Message *</label>
            <textarea
              required
              placeholder="Insert Message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              rows={6}
              className={`${inputClass} resize-none h-full`}
            />
          </div>

          <div>
            <label className={labelClass}>Last Name *</label>
            <input
              required
              type="text"
              placeholder="Insert Last Name"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Email Address *</label>
            <input
              required
              type="email"
              placeholder="Insert E-mail Address"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Phone No.</label>
            <input
              type="tel"
              placeholder="Insert Phone Number"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Country/Region *</label>
            <select
              required
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className={inputClass}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 pt-4 border-t border-palladio-border space-y-3">
            <p className="tracked-label text-xs">Consent to the Processing of Your Data</p>
            <label className="flex items-start gap-3 text-sm text-palladio-grey">
              <input
                type="checkbox"
                required
                checked={form.consent}
                onChange={(e) => update("consent", e.target.checked)}
                className="mt-0.5"
              />
              I have read and understood the{" "}
              <a href="/privacy-policy" className="underline hover:text-black">
                Privacy Policy
              </a>{" "}
              and consent to Palladio contacting me about my inquiry.
            </label>
          </div>

          <div className="md:col-span-2 flex flex-col items-center gap-4 pt-4">
            <button type="submit" disabled={status === "sending"} className="btn-solid px-16 disabled:opacity-50">
              {status === "sending" ? "Sending…" : "Submit"}
            </button>
            {status === "sent" && (
              <p className="text-xs text-palladio-grey">
                Thank you — your message has been sent. We&apos;ll get back to you shortly.
              </p>
            )}
            {status === "error" && <p className="text-xs text-red-600">We couldn&apos;t send your message. Please try again or email info@palladio.hr.</p>}
          </div>
        </form>
      </section>
    </>
  );
}

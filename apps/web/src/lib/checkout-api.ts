/**
 * WooCommerce Store API — checkout flow
 * POST /wc/store/v1/checkout  (kreira order)
 * CRM API (Vercel Next.js) — kreira Stripe PaymentIntent za košaricu
 *
 * VITE_WP_URL  = https://palladio.hr  (WordPress backend)
 * VITE_CRM_URL = https://crm.palladio.hr  (Vercel CRM — samo za PaymentIntent)
 *
 * Ako je VITE_CRM_URL prazan, pada nazad na stari WordPress endpoint
 * (kompatibilnost za slučaj da CRM nije deployat).
 */

const WP_URL  = (import.meta.env.VITE_WP_URL  || "").replace(/\/+$/, "");
const CRM_URL = (import.meta.env.VITE_CRM_URL || "").replace(/\/+$/, "");

const STORE_BASE = `${WP_URL}/wp-json/wc/store/v1`;

export interface BillingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string;
  email: string;
  phone?: string;
}

export interface CheckoutPayload {
  billing_address: BillingAddress;
  shipping_address?: BillingAddress;
  payment_method: string;
  payment_data?: { key: string; value: string }[];
  customer_note?: string;
}

export interface CheckoutResult {
  order_id: number;
  order_key: string;
  redirect_url: string;
  payment_result: {
    payment_status: string;
    payment_details: { key: string; value: string }[];
    redirect_url?: string;
  };
}

let _nonce: string | null = null;
async function getStoreNonce(): Promise<string> {
  if (_nonce) return _nonce;
  const res = await fetch(`${STORE_BASE}/cart`, { credentials: "include" });
  _nonce = res.headers.get("X-WC-Store-API-Nonce") || "";
  return _nonce;
}

async function storeFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${STORE_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-WC-Store-API-Nonce": await getStoreNonce(),
      ...(options.headers || {}),
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.message || `Store API ${res.status}`);
  return body;
}

export async function placeOrder(payload: CheckoutPayload): Promise<CheckoutResult> {
  return storeFetch<CheckoutResult>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Kreira Stripe PaymentIntent za cart checkout.
 * Koristi Vercel CRM API ako je VITE_CRM_URL postavljen,
 * inače stari WordPress endpoint (legacy).
 */
export async function createPaymentIntent(
  amountCents: number,
  currency: string,
  orderId: number
): Promise<{ client_secret: string; intent_id?: string }> {
  if (CRM_URL) {
    // Nova ruta: Vercel CRM
    const res = await fetch(`${CRM_URL}/api/stripe/cart-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountCents, currency, order_id: orderId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Greška PaymentIntent");
    return data;
  }

  // Stari WordPress endpoint (fallback)
  const res = await fetch(`${WP_URL}/wp-json/palladio-stripe/v1/create-intent`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountCents, currency, order_id: orderId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Greška PaymentIntent");
  return data;
}

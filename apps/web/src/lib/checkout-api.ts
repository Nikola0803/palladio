import { crmUrl } from "./env";
import type { CartItem } from "./cart";

const CRM_URL = crmUrl(import.meta.env.VITE_CRM_URL);

export interface BillingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address_1: string;
  city: string;
  postcode: string;
  country: string;
}

export interface OrderResult {
  orderId: number;
}

export async function placeOrder(payload: {
  items: CartItem[];
  billing: BillingAddress;
  stripeIntentId: string;
  note?: string;
}): Promise<OrderResult> {
  const url = `${CRM_URL}/api/narudzbe/checkout`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data?.error || `Greška kreiranja narudžbe (${res.status})`);
  return { orderId: data.orderId };
}

export async function createPaymentIntent(
  amountCents: number,
  currency: string,
  orderId?: number
): Promise<{ client_secret: string; intent_id?: string }> {
  const url = `${CRM_URL}/api/stripe/cart-intent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountCents, currency, order_id: orderId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Greška PaymentIntent");
  return data;
}

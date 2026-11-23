export type PaymentLinkItem = { productId?: number; name: string; quantity: number; unitPrice: number };
export type PaymentLinkMeta = { note?: string; items: PaymentLinkItem[]; manualTotal?: boolean };

export function paymentLinkMeta(value: string | null): PaymentLinkMeta {
  try {
    const parsed = JSON.parse(value || "");
    if (parsed?._type === "payment_link" && Array.isArray(parsed.items)) return parsed;
  } catch {}
  return { note: value || "", items: [], manualTotal: true };
}

export function serializePaymentLinkMeta(meta: PaymentLinkMeta) {
  return JSON.stringify({ _type: "payment_link", ...meta });
}

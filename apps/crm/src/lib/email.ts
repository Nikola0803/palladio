import { getPostavka } from "@/lib/settings";

/**
 * Minimal Resend client. Reads RESEND_API_KEY / EMAIL_FROM / EMAIL_BCC from
 * settings (DB) with env fallback. Throws a readable error if not configured
 * so the caller can surface it in the UI.
 *
 * Resend docs: https://resend.com/docs/api-reference/emails/send-email
 */
export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
};

export async function sendEmail(input: SendEmailInput): Promise<{ id?: string }> {
  const apiKey = (await getPostavka("RESEND_API_KEY")) || "";
  if (!apiKey) {
    throw new Error("Resend nije podešen — dodaj RESEND_API_KEY u Postavke.");
  }
  const from =
    (await getPostavka("EMAIL_FROM")) || "Palladio <info@palladio.hr>";
  const envBcc = (await getPostavka("EMAIL_BCC")) || "";

  const bcc = input.bcc ?? (envBcc ? envBcc.split(",").map((s) => s.trim()).filter(Boolean) : undefined);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      ...(bcc ? { bcc } : {}),
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      ...(input.attachments ? { attachments: input.attachments } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${text || "slanje nije uspjelo"}`);
  }
  return res.json().catch(() => ({}));
}

import "server-only";
import { headers } from "next/headers";
import { siteUrl } from "@/content/site";

export type Email = { to: string; subject: string; text: string };

/**
 * Sends an account email through Resend. Off until ACCOUNT_EMAILS=on, so the
 * wording can be approved first. Never throws: a failed email must not stop a
 * sign-up or an approval.
 */
export async function sendEmail({ to, subject, text }: Email): Promise<void> {
  if (process.env.ACCOUNT_EMAILS !== "on") return;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set, so no email was sent.");
    return;
  }
  const from = process.env.ACCOUNT_EMAIL_FROM || process.env.ENQUIRY_EMAIL_FROM || "Axon Arbor <hello@wishcow.in>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!res.ok) console.error("[email] Resend refused the email:", res.status, (await res.text()).slice(0, 300));
  } catch (error) {
    console.error("[email] Could not send:", (error as Error).message);
  }
}

/** The address the visitor is on, so links work on any deployment. */
export async function siteOrigin(): Promise<string> {
  return (await headers()).get("origin") ?? siteUrl;
}

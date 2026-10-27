import "server-only";
import type { ContactPayload } from "./contact-validation";

/**
 * Emails the team when someone sends the contact form, through Resend.
 *
 * Settings (Vercel → Project → Environment Variables):
 * - RESEND_API_KEY      required; without it no email is sent (the enquiry is still saved)
 * - ENQUIRY_EMAIL_TO    who gets it; comma-separated; default info@axonarbor.in
 * - ENQUIRY_EMAIL_FROM  sender; must be on a domain verified in Resend
 *
 * Replying to the email goes straight to the person who sent the enquiry.
 */
export async function emailEnquiry(data: ContactPayload, adminUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[contact] RESEND_API_KEY is not set, so no enquiry email was sent.");
    return;
  }

  const to = (process.env.ENQUIRY_EMAIL_TO || "info@axonarbor.in")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const from = process.env.ENQUIRY_EMAIL_FROM || "Axon Arbor website <hello@wishcow.in>";

  const lines = [
    `New enquiry from the Axon Arbor website.`,
    ``,
    `Name: ${data.name}`,
    `Organisation: ${data.organisation}`,
    ...(data.role ? [`Role: ${data.role}`] : []),
    `Email: ${data.email}`,
    ...(data.phone ? [`Phone: ${data.phone}`] : []),
    ``,
    `Message:`,
    data.message,
    ``,
    `Reply to this email to answer ${data.name} directly.`,
    `All enquiries: ${adminUrl}`,
  ];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      reply_to: data.email,
      subject: `New enquiry: ${data.name}, ${data.organisation}`,
      text: lines.join("\n"),
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

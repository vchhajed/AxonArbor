import { after } from "next/server";
import { enquiryReceived } from "@/lib/email/messages";
import { sendEmail } from "@/lib/email/send";
import { emailEnquiry } from "@/lib/enquiry-email";
import { clientIp, isLimited, recordAttempt } from "@/lib/security/rate-limit";
import { normaliseContact, validateContact } from "@/lib/contact-validation";
import { TABLES } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Receives contact form submissions: validates them and stores them in
 * Supabase, where admins read them at /admin/enquiries.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (body && typeof body === "object" && (body as Record<string, unknown>).website) {
    return Response.json({ ok: true });
  }

  const data = normaliseContact(body);
  const errors = validateContact(data);
  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, errors }, { status: 422 });
  }

  // Stored for the admin dashboard (/admin/enquiries). The anonymous role may
  // only insert, never read, so no enquiry data is returned here.
  const { error } = await createPublicClient()
    .from(TABLES.submissions)
    .insert({
      name: data.name,
      organisation: data.organisation,
      role: data.role || null,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
    });

  if (error) {
    console.error("[contact] Could not store enquiry:", error.message, { email: data.email });
    return Response.json({ ok: false, error: "Could not send your message." }, { status: 503 });
  }

  // Tell the team by email once the visitor has their answer, so a slow or
  // failed email never holds up or fails the form. The enquiry is already saved.
  const adminUrl = new URL("/admin/enquiries", request.url).toString();
  after(() =>
    emailEnquiry(data, adminUrl).catch((e) =>
      console.error("[contact] Enquiry email failed:", (e as Error).message, { email: data.email }),
    ),
  );
  // The address isn't verified, so the automatic reply is limited: the form can't be used to mail-bomb someone.
  const ip = await clientIp();
  after(async () => {
    const limits = [
      { key: `enquiry-reply-ip:${ip}`, max: 5, windowMinutes: 60 },
      { key: `enquiry-reply:${data.email}`, max: 2, windowMinutes: 60 },
    ];
    if (await isLimited(limits)) return;
    await recordAttempt(limits.map((l) => l.key));
    await sendEmail({ to: data.email, ...enquiryReceived(data.name) });
  });
  return Response.json({ ok: true });
}

"use server";

import { after } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { ACCOUNT_TABLES } from "@/lib/accounts/data";
import { hashPassword, temporaryPassword } from "@/lib/accounts/password";
import { createPasswordToken } from "@/lib/accounts/session";
import { invitedWelcome } from "@/lib/email/messages";
import { sendEmail, siteOrigin } from "@/lib/email/send";
import { rowProblem, splitServices, type ImportRow } from "@/lib/phase2/import";
import { normaliseUrl } from "@/lib/phase2/validate";

export type ImportResult = { row: number; name: string; email: string; created: boolean; reason?: string; link?: string };

const MAX_ROWS = 25;
const ROSTER_TABLE = "axon_arbor_trainer_roster";
const nullable = (value: string) => value || null;

/** Creates consultant accounts with draft profiles. Called in small batches so each request stays short. */
export async function importConsultants(rows: ImportRow[]): Promise<{ ok: true; results: ImportResult[] } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (rows.length > MAX_ROWS) return { ok: false, error: "Too many rows in one batch." };
  const db = session.supabase;
  const origin = await siteOrigin();
  const results: ImportResult[] = [];

  for (const r of rows) {
    const email = r.email.trim().toLowerCase();
    const result: ImportResult = { row: r.row, name: r.full_name, email, created: false };
    results.push(result);

    const problem = rowProblem(r);
    if (problem) {
      result.reason = problem;
      continue;
    }
    const passwordHash = await hashPassword(temporaryPassword());
    const { data, error } = await db
      .from(ACCOUNT_TABLES.accounts)
      .insert({ email, password_hash: passwordHash, role: "consultant", status: "approved", reviewed_by: session.user.name })
      .select("id")
      .single();
    if (error || !data) {
      result.reason = error?.code === "23505" ? "Already has an account" : "Couldn’t create the account";
      continue;
    }
    const { error: profileError } = await db.from(ACCOUNT_TABLES.consultants).insert({
      account_id: data.id,
      full_name: r.full_name.slice(0, 120),
      phone: nullable(r.phone),
      city: nullable(r.city),
      expertise: [...new Set([r.expertise_1, r.expertise_2, r.expertise_3].filter(Boolean))],
      years_experience: r.years_experience === "" ? null : Number(r.years_experience),
      industries: nullable(r.industries.slice(0, 300)),
      delivery_mode: nullable(r.delivery_mode),
      languages: nullable(r.languages.slice(0, 200)),
      bio: nullable(r.bio),
      linkedin_url: r.linkedin_url ? normaliseUrl(r.linkedin_url) : null,
      certifications: nullable(r.certifications.slice(0, 300)),
      notable_clients: nullable(r.notable_clients.slice(0, 300)),
      day_rate_band: nullable(r.day_rate_band),
      availability: nullable(r.availability.slice(0, 120)),
      consent: r.consent.toLowerCase() === "yes",
      services_of_interest: splitServices(r.services),
    });
    if (profileError) {
      await db.from(ACCOUNT_TABLES.accounts).delete().eq("id", data.id);
      result.reason = "Couldn’t save the profile";
      continue;
    }

    // Link the trainer network entry, if there is one. Ignored when that table isn't set up.
    await db.from(ROSTER_TABLE).update({ account_id: data.id }).eq("email", email).is("account_id", null);

    result.created = true;
    result.link = `${origin}/set-password?token=${createPasswordToken(data.id, passwordHash)}`;
    const link = result.link;
    after(() => sendEmail({ to: email, ...invitedWelcome(r.full_name, link) }));
  }
  return { ok: true, results };
}

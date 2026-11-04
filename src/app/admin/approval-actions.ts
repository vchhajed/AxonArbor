"use server";

import { getAdminSession } from "@/lib/admin/auth";
import { ACCOUNT_TABLES } from "@/lib/accounts/data";
import { hashPassword, temporaryPassword } from "@/lib/accounts/password";
import { MEDIA_BUCKET } from "@/lib/supabase/config";

type Result = { ok: true; password?: string } | { ok: false; error: string };

const SESSION_EXPIRED = "Your session has expired. Please sign in again.";
const now = () => new Date().toISOString();
const cleanNote = (note?: string) => (note ?? "").trim().slice(0, 1000) || null;

async function admin() {
  const session = await getAdminSession();
  return session ? { supabase: session.supabase, by: session.user.name } : null;
}

/** Approve or reject a company registration. */
export async function reviewCompany(accountId: string, decision: "approve" | "reject", note?: string): Promise<Result> {
  const a = await admin();
  if (!a) return { ok: false, error: SESSION_EXPIRED };
  const { error } = await a.supabase
    .from(ACCOUNT_TABLES.accounts)
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      reviewed_at: now(),
      reviewed_by: a.by,
      review_note: cleanNote(note),
      updated_at: now(),
    })
    .eq("id", accountId)
    .eq("role", "company");
  return error ? { ok: false, error: "Couldn’t save the decision." } : { ok: true };
}

/**
 * Decide on a consultant profile.
 * approve → live · changes → changes requested (note shown to the consultant) ·
 * remove → removed (also used to accept a removal request) · keep → back to live (declines a removal request).
 */
export async function reviewProfile(accountId: string, decision: "approve" | "changes" | "remove" | "keep", note?: string): Promise<Result> {
  const a = await admin();
  if (!a) return { ok: false, error: SESSION_EXPIRED };
  const status = { approve: "live", changes: "changes_requested", remove: "removed", keep: "live" }[decision];
  if (decision === "changes" && !cleanNote(note)) return { ok: false, error: "Please say what needs changing." };
  const { error } = await a.supabase
    .from(ACCOUNT_TABLES.consultants)
    .update({ profile_status: status, reviewed_at: now(), review_note: cleanNote(note), updated_at: now() })
    .eq("account_id", accountId);
  return error ? { ok: false, error: "Couldn’t save the decision." } : { ok: true };
}

/** Pause an account (it can't sign in) or restore it. */
export async function setAccountSuspended(accountId: string, suspended: boolean): Promise<Result> {
  const a = await admin();
  if (!a) return { ok: false, error: SESSION_EXPIRED };
  const { error } = await a.supabase
    .from(ACCOUNT_TABLES.accounts)
    .update({ status: suspended ? "suspended" : "approved", reviewed_at: now(), reviewed_by: a.by, updated_at: now() })
    .eq("id", accountId);
  return error ? { ok: false, error: "Couldn’t update the account." } : { ok: true };
}

/** Sets a new temporary password and returns it once, for the admin to pass on. */
export async function resetAccountPassword(accountId: string): Promise<Result> {
  const a = await admin();
  if (!a) return { ok: false, error: SESSION_EXPIRED };
  const password = temporaryPassword();
  const { error } = await a.supabase
    .from(ACCOUNT_TABLES.accounts)
    .update({ password_hash: await hashPassword(password), updated_at: now() })
    .eq("id", accountId);
  return error ? { ok: false, error: "Couldn’t reset the password." } : { ok: true, password };
}

/** Permanently deletes an account, its profile (cascade) and any uploaded photos. */
export async function deleteAccount(accountId: string): Promise<Result> {
  const a = await admin();
  if (!a) return { ok: false, error: SESSION_EXPIRED };
  const folder = `consultants/${accountId}`;
  const bucket = a.supabase.storage.from(MEDIA_BUCKET);
  const { data: files } = await bucket.list(folder);
  if (files?.length) await bucket.remove(files.map((f) => `${folder}/${f.name}`));
  const { error } = await a.supabase.from(ACCOUNT_TABLES.accounts).delete().eq("id", accountId);
  return error ? { ok: false, error: "Couldn’t delete the account." } : { ok: true };
}

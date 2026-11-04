"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isContentKey } from "@/content/registry";
import { getAdminSession } from "@/lib/admin/auth";
import {
  adminConfigured,
  checkCredentials,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/admin/session";
import { clearAttempts, clientIp, isLimited, recordAttempt } from "@/lib/security/rate-limit";
import { stripMarkers } from "@/lib/stega";
import { CONTENT_TAG, MEDIA_BUCKET, MEDIA_FOLDER, RPC, TABLES } from "@/lib/supabase/config";

export type ActionResult = { ok: true } | { ok: false; error: string };

const SESSION_EXPIRED = "Your session has expired. Please sign in again.";
const MAX_DOCUMENT_BYTES = 500_000;

/* ---------- login ---------- */

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!adminConfigured()) {
    return { error: "Admin login isn’t set up yet: add ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SESSION_SECRET." };
  }
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");

  const limits = [{ key: `admin-login-ip:${await clientIp()}`, max: 10, windowMinutes: 15 }];
  if (await isLimited(limits)) return { error: "Too many attempts. Please wait 15 minutes and try again." };
  if (!checkCredentials(username, password)) {
    await recordAttempt(limits.map((l) => l.key));
    // Slow down guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "That username and password don’t match. Please try again." };
  }
  await clearAttempts(limits.map((l) => l.key));

  (await cookies()).set(SESSION_COOKIE, createSessionToken(username.trim()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/admin");
}

export async function signOut() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

/* ---------- content ---------- */

/** Removes any inline-editor markers that slipped into a value. */
function clean(value: unknown): unknown {
  if (typeof value === "string") return stripMarkers(value);
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clean(v)]));
  }
  return value;
}

/** Saves edited pages as drafts. Nothing changes on the live site until publish. */
export async function saveDrafts(changes: { key: string; data: unknown }[]): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  if (changes.length === 0) return { ok: true };

  const rows = [];
  for (const { key, data } of changes) {
    if (!isContentKey(key)) return { ok: false, error: `Unknown page “${key}”.` };
    const cleaned = clean(data);
    if (JSON.stringify(cleaned).length > MAX_DOCUMENT_BYTES) {
      return { ok: false, error: `The “${key}” page is too large to save.` };
    }
    rows.push({ key, status: "draft", data: cleaned, updated_at: new Date().toISOString() });
  }

  const { error } = await session.supabase.from(TABLES.content).upsert(rows, { onConflict: "key,status" });
  return error ? { ok: false, error: `Could not save: ${error.message}` } : { ok: true };
}

/** Makes every draft live and refreshes the public site's cache. */
export async function publishSite(): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };

  const { error } = await session.supabase.rpc(RPC.publish, { publisher: session.user.name });
  if (error) return { ok: false, error: `Could not publish: ${error.message}` };

  updateTag(CONTENT_TAG);
  return { ok: true };
}

/** Throws away unpublished edits, resetting drafts to the live site. */
export async function discardDrafts(): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  const { error } = await session.supabase.rpc(RPC.discardDraft);
  return error ? { ok: false, error: `Could not discard: ${error.message}` } : { ok: true };
}

/** Loads an earlier published version into the drafts, ready to review and publish. */
export async function restoreVersion(versionId: number): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  const { error } = await session.supabase.rpc(RPC.restoreVersion, { version_id: versionId });
  return error ? { ok: false, error: `Could not restore: ${error.message}` } : { ok: true };
}

/* ---------- enquiries ---------- */

export async function updateSubmission(
  id: string,
  patch: { status?: "new" | "read" | "archived"; notes?: string | null },
): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  const allowed: typeof patch = {};
  if (patch.status && ["new", "read", "archived"].includes(patch.status)) allowed.status = patch.status;
  if ("notes" in patch) allowed.notes = patch.notes ? String(patch.notes).slice(0, 4000) : null;
  const { error } = await session.supabase.from(TABLES.submissions).update(allowed).eq("id", id);
  return error ? { ok: false, error: `Could not update: ${error.message}` } : { ok: true };
}

export async function deleteSubmission(id: string): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  const { error } = await session.supabase.from(TABLES.submissions).delete().eq("id", id);
  return error ? { ok: false, error: `Could not delete: ${error.message}` } : { ok: true };
}

/* ---------- images ---------- */

const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export type UploadTarget =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; error: string };

/**
 * Issues a short-lived signed upload URL so the browser can send the file
 * straight to storage without the secret key ever leaving the server.
 */
export async function createUploadTarget(file: {
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
}): Promise<UploadTarget> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, error: "Please choose a PNG, JPG, WebP, GIF, AVIF or SVG image." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Images must be smaller than 10 MB." };

  const base =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "image";
  const dims = `${Math.round(file.width) || 0}x${Math.round(file.height) || 0}`;
  const path = `${MEDIA_FOLDER}/${Date.now()}-${dims}-${base}.${ext}`;

  const bucket = session.supabase.storage.from(MEDIA_BUCKET);
  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: `Upload failed: ${error?.message ?? "no upload URL"}` };
  return { ok: true, path: data.path, token: data.token, publicUrl: bucket.getPublicUrl(data.path).data.publicUrl };
}

export type MediaFile = { name: string; src: string; width: number; height: number };

const DIMENSIONS_RE = /^\d+-(\d+)x(\d+)-(.+)$/;

export async function listMedia(): Promise<{ ok: true; items: MediaFile[] } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  const bucket = session.supabase.storage.from(MEDIA_BUCKET);
  const { data, error } = await bucket.list(MEDIA_FOLDER, {
    limit: 500,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return { ok: false, error: `Could not load images: ${error.message}` };
  const items = (data ?? [])
    .filter((f) => f.name && !f.name.startsWith("."))
    .map((f) => {
      const match = f.name.match(DIMENSIONS_RE);
      return {
        name: match?.[3] ?? f.name,
        src: bucket.getPublicUrl(`${MEDIA_FOLDER}/${f.name}`).data.publicUrl,
        width: match ? Number(match[1]) || 1200 : 1200,
        height: match ? Number(match[2]) || 800 : 800,
      };
    });
  return { ok: true, items };
}

export async function deleteMedia(src: string): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };
  const marker = `/${MEDIA_BUCKET}/`;
  const at = src.indexOf(marker);
  if (at === -1) return { ok: false, error: "Only uploaded images can be deleted." };
  const path = decodeURIComponent(src.slice(at + marker.length));
  if (!path.startsWith(`${MEDIA_FOLDER}/`)) return { ok: false, error: "Only uploaded images can be deleted." };
  const { error } = await session.supabase.storage.from(MEDIA_BUCKET).remove([path]);
  return error ? { ok: false, error: `Could not delete: ${error.message}` } : { ok: true };
}

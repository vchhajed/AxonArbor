import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sessions for consultant and company accounts: a signed, http-only cookie
 * separate from the admin session. The signing key is ACCOUNT_SESSION_SECRET,
 * or derived from ADMIN_SESSION_SECRET so no extra setting is required.
 */

export const ACCOUNT_COOKIE = "aa_account";
export const ACCOUNT_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type AccountRole = "consultant" | "company";
/** pv: fingerprint of the password hash, so changing or resetting a password ends every other session. */
type Payload = { typ: "account"; sub: string; role: AccountRole; pv: string; exp: number };

function key(): string {
  const own = process.env.ACCOUNT_SESSION_SECRET;
  if (own && own.length >= 16) return own;
  const admin = process.env.ADMIN_SESSION_SECRET;
  if (!admin || admin.length < 16) throw new Error("ACCOUNT_SESSION_SECRET (or ADMIN_SESSION_SECRET) is not set.");
  // Domain-separated so an account token can never verify as an admin token.
  return createHmac("sha256", admin).update("axon-arbor-account-sessions").digest("base64url");
}

const sign = (body: string) => createHmac("sha256", key()).update(`account.${body}`).digest("base64url");

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Short keyed fingerprint of a password hash (never the hash itself). */
export function passwordVersion(passwordHash: string): string {
  return createHmac("sha256", key()).update(`pv.${passwordHash}`).digest("base64url").slice(0, 22);
}

export function createAccountToken(accountId: string, role: AccountRole, passwordHash: string): string {
  const payload: Payload = { typ: "account", sub: accountId, role, pv: passwordVersion(passwordHash), exp: Math.floor(Date.now() / 1000) + ACCOUNT_SESSION_MAX_AGE };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readAccountToken(token: string | undefined): { id: string; role: AccountRole; pv: string } | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  try {
    if (!safeEqual(signature, sign(body))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (payload.typ !== "account" || payload.exp < Date.now() / 1000) return null;
    if (payload.role !== "consultant" && payload.role !== "company") return null;
    if (typeof payload.pv !== "string") return null;
    return { id: payload.sub, role: payload.role, pv: payload.pv };
  } catch {
    return null;
  }
}

export const accountCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ACCOUNT_SESSION_MAX_AGE,
};

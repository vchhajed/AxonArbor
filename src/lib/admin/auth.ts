import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { adminConfigured, readSessionToken, SESSION_COOKIE } from "./session";

export type AdminSession = {
  supabase: ReturnType<typeof createServiceClient>;
  user: { name: string };
};

/**
 * Data access layer for the admin. Every admin page and server action calls
 * this, so authorisation never relies on the browser: no valid signed cookie,
 * no database access.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (!adminConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await connection(); // the token's expiry check reads the clock, so it must run at request time
  const name = readSessionToken(token);
  if (!name) return null;
  // Created on first use, so pages can still render a setup notice when the key is missing.
  let client: ReturnType<typeof createServiceClient> | null = null;
  return {
    user: { name },
    get supabase() {
      return (client ??= createServiceClient());
    },
  };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

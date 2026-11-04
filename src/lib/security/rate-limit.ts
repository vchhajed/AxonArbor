import "server-only";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";

const TABLE = "axon_arbor_rate_limits";

export type Limit = { key: string; max: number; windowMinutes: number };

/** The visitor's IP as reported by Vercel's edge (first entry of x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * True when any of the limits has been reached. Fails open: if the table is
 * missing or the database is unreachable, nobody is locked out.
 */
export async function isLimited(limits: Limit[]): Promise<boolean> {
  try {
    const db = createServiceClient();
    const counts = await Promise.all(
      limits.map(async (l) => {
        const since = new Date(Date.now() - l.windowMinutes * 60_000).toISOString();
        const { count, error } = await db.from(TABLE).select("id", { count: "exact", head: true }).eq("key", l.key).gte("created_at", since);
        if (error) throw error;
        return (count ?? 0) >= l.max;
      }),
    );
    return counts.some(Boolean);
  } catch {
    return false;
  }
}

/** Records one attempt against each key, and occasionally clears out old rows. */
export async function recordAttempt(keys: string[]): Promise<void> {
  try {
    const db = createServiceClient();
    await db.from(TABLE).insert(keys.map((key) => ({ key })));
    if (Math.random() < 0.05) {
      await db.from(TABLE).delete().lt("created_at", new Date(Date.now() - 24 * 60 * 60_000).toISOString());
    }
  } catch {
    // Rate limiting must never break sign-in.
  }
}

/** Forgets failed attempts for these keys (after a successful sign-in). */
export async function clearAttempts(keys: string[]): Promise<void> {
  try {
    await createServiceClient().from(TABLE).delete().in("key", keys);
  } catch {
    // ignore
  }
}

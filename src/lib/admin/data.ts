import "server-only";
import { contentDefaults, type ContentKey, type ContentMap } from "@/content/registry";
import { mergeDocument } from "@/lib/content/merge";
import { RETIRED_DEFAULTS } from "@/lib/content/retired";
import { TABLES } from "@/lib/supabase/config";
import type { AdminSession } from "./auth";

type Row = { key: string; status: "draft" | "published"; data: unknown; updated_at: string };

export type Submission = {
  id: string;
  created_at: string;
  name: string;
  organisation: string;
  role: string | null;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "read" | "archived";
  notes: string | null;
};

export type Version = {
  id: number;
  published_at: string;
  published_by: string | null;
};

async function contentRows({ supabase }: AdminSession, key?: ContentKey): Promise<Row[]> {
  let query = supabase.from(TABLES.content).select("key, status, data, updated_at");
  if (key) query = query.eq("key", key);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load content: ${error.message}`);
  return (data ?? []) as Row[];
}

/** The working copy an admin edits: draft, else published, else the defaults. */
export async function getDraftContent<K extends ContentKey>(
  session: AdminSession,
  key: K,
): Promise<{ content: ContentMap[K]; updatedAt: string | null; isDraft: boolean }> {
  const rows = await contentRows(session, key);
  const draft = rows.find((r) => r.status === "draft");
  const published = rows.find((r) => r.status === "published");
  const source = draft ?? published;
  return {
    content: mergeDocument(contentDefaults[key], source?.data, RETIRED_DEFAULTS[key]),
    updatedAt: source?.updated_at ?? null,
    isDraft: Boolean(draft),
  };
}

/** Working copies of every content document, for the inline editor. */
export async function getAllDraftContent(session: AdminSession): Promise<ContentMap> {
  const rows = await contentRows(session);
  return Object.fromEntries(
    (Object.keys(contentDefaults) as ContentKey[]).map((key) => {
      const source =
        rows.find((r) => r.key === key && r.status === "draft") ??
        rows.find((r) => r.key === key && r.status === "published");
      return [key, mergeDocument(contentDefaults[key], source?.data, RETIRED_DEFAULTS[key])];
    }),
  ) as ContentMap;
}

/** Page keys whose draft differs from what is live. */
export async function getUnpublishedKeys(session: AdminSession): Promise<ContentKey[]> {
  const rows = await contentRows(session);
  const changed: ContentKey[] = [];
  for (const draft of rows.filter((r) => r.status === "draft")) {
    const live = rows.find((r) => r.key === draft.key && r.status === "published");
    if (!live || JSON.stringify(live.data) !== JSON.stringify(draft.data)) {
      changed.push(draft.key as ContentKey);
    }
  }
  return changed;
}

export async function getSubmissions(
  { supabase }: AdminSession,
  status?: Submission["status"],
): Promise<Submission[]> {
  let query = supabase.from(TABLES.submissions).select("*").order("created_at", { ascending: false }).limit(500);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load enquiries: ${error.message}`);
  return (data ?? []) as Submission[];
}

export async function countNewSubmissions({ supabase }: AdminSession): Promise<number> {
  const { count } = await supabase
    .from(TABLES.submissions)
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  return count ?? 0;
}

export async function getVersions({ supabase }: AdminSession): Promise<Version[]> {
  const { data, error } = await supabase
    .from(TABLES.versions)
    .select("id, published_at, published_by")
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Could not load history: ${error.message}`);
  return (data ?? []) as Version[];
}

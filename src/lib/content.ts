import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { contentDefaults, type ContentKey, type ContentMap } from "@/content/registry";
import { mergeDocument } from "./content/merge";
import { RETIRED_DEFAULTS } from "./content/retired";
import { CONTENT_TAG, TABLES } from "./supabase/config";
import { createPublicClient } from "./supabase/public";

/**
 * Published content for a page: what the public site renders. Cached and
 * tagged, so publishing from the admin (updateTag) refreshes it without a
 * redeploy. Falls back to the code defaults if Supabase is unavailable.
 */
export async function getContent<K extends ContentKey>(key: K): Promise<ContentMap[K]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("max");

  try {
    const { data, error } = await createPublicClient()
      .from(TABLES.content)
      .select("data")
      .eq("key", key)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return mergeDocument(contentDefaults[key], data?.data, RETIRED_DEFAULTS[key]);
  } catch (error) {
    console.warn(`[content] Using defaults for "${key}":`, (error as Error).message);
    return contentDefaults[key];
  }
}

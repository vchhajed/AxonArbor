import "server-only";
import type { AdminSession } from "@/lib/admin/auth";

export const ROSTER_TABLE = "axon_arbor_trainer_roster";

export type RosterTrainer = {
  id: string;
  slug: string;
  full_name: string;
  city: string | null;
  specialities: string[];
  years_experience: string | null;
  certifications: string | null;
  qualifications: string | null;
  key_clients: string | null;
  testimonials: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  price_per_hour: string | null;
  price_half_day: string | null;
  availability: string | null;
  photo_path: string | null;
  verification_note: string | null;
  account_id: string | null;
};

/** The whole trainer network, A to Z. Null when the table isn't there yet (migration not applied). */
export async function getRoster({ supabase }: AdminSession): Promise<RosterTrainer[] | null> {
  const { data, error } = await supabase.from(ROSTER_TABLE).select("*").order("full_name");
  if (error) return null;
  return data as RosterTrainer[];
}

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/admin";
import { ACCOUNT_COOKIE, passwordVersion, readAccountToken, type AccountRole } from "./session";

export const ACCOUNT_TABLES = {
  accounts: "axon_arbor_accounts",
  consultants: "axon_arbor_consultant_profiles",
  companies: "axon_arbor_company_profiles",
} as const;

export type AccountStatus = "pending" | "approved" | "rejected" | "suspended";

export type Account = {
  id: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  last_login_at: string | null;
};

export type ProfileStatus = "draft" | "pending" | "live" | "changes_requested" | "removal_requested" | "removed";

export type ConsultantProfile = {
  account_id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  expertise: string[];
  services_of_interest: string[];
  years_experience: number | null;
  industries: string | null;
  delivery_mode: string | null;
  languages: string | null;
  bio: string | null;
  linkedin_url: string | null;
  certifications: string | null;
  notable_clients: string | null;
  day_rate_band: string | null;
  availability: string | null;
  photo_url: string | null;
  consent: boolean;
  profile_status: ProfileStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  updated_at: string;
};

export type CompanyProfile = {
  account_id: string;
  company_name: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  employee_count: string | null;
  account_manager: string | null;
  contact_name: string;
  contact_role: string | null;
  phone: string | null;
  email_domain: string;
};

const ACCOUNT_COLUMNS = "id, email, role, status, created_at, reviewed_at, review_note, last_login_at";

/** The signed-in consultant or company, re-read from the database on every request. */
export async function getCurrentAccount(): Promise<Account | null> {
  const session = readAccountToken((await cookies()).get(ACCOUNT_COOKIE)?.value);
  if (!session) return null;
  const { data } = await createServiceClient()
    .from(ACCOUNT_TABLES.accounts)
    .select(`${ACCOUNT_COLUMNS}, password_hash`)
    .eq("id", session.id)
    .maybeSingle();
  if (!data) return null;
  const { password_hash, ...account } = data as Account & { password_hash: string };
  // Only approved accounts have access, so pausing or deleting one takes effect immediately, as does a password change.
  if (account.status !== "approved" || account.role !== session.role) return null;
  if (passwordVersion(password_hash) !== session.pv) return null;
  return account;
}

export async function requireAccount(): Promise<Account> {
  const account = await getCurrentAccount();
  if (!account) redirect("/sign-in");
  return account;
}

export async function getConsultantProfile(accountId: string): Promise<ConsultantProfile | null> {
  const { data } = await createServiceClient().from(ACCOUNT_TABLES.consultants).select("*").eq("account_id", accountId).maybeSingle();
  return data as ConsultantProfile | null;
}

export async function getCompanyProfile(accountId: string): Promise<CompanyProfile | null> {
  const { data } = await createServiceClient().from(ACCOUNT_TABLES.companies).select("*").eq("account_id", accountId).maybeSingle();
  return data as CompanyProfile | null;
}

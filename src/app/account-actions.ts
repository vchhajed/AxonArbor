"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { ACCOUNT_TABLES, getCurrentAccount, getConsultantProfile } from "@/lib/accounts/data";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/accounts/password";
import { ACCOUNT_COOKIE, accountCookieOptions, createAccountToken, type AccountRole } from "@/lib/accounts/session";
import {
  CITIES,
  DAY_RATE_BANDS,
  DELIVERY_MODES,
  EMAIL_RE,
  emailDomain,
  EMPLOYEE_BANDS,
  EXPERTISE,
  isWorkEmail,
} from "@/lib/phase2/options";
import { isLinkedIn, isPhone, normaliseUrl } from "@/lib/phase2/validate";
import { clearAttempts, clientIp, isLimited, recordAttempt } from "@/lib/security/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { MEDIA_BUCKET, SUPABASE_URL } from "@/lib/supabase/config";

export type FormState = { error: string | null; fieldErrors?: Record<string, string>; ok?: string; values?: Record<string, string> };

const SECRET_FIELDS = new Set(["password", "current_password", "new_password", "website_url", "intent"]);

const UNEXPECTED = "Sorry, something went wrong on our side. Please try again in a moment.";

/** Runs an action, turning unexpected failures (e.g. the database being unreachable) into a friendly message. */
async function safely(run: () => Promise<FormState>): Promise<FormState> {
  try {
    return await run();
  } catch (error) {
    unstable_rethrow(error); // let redirect() through
    console.error("[account]", error);
    return { error: UNEXPECTED };
  }
}

/** Sends typed values back with the result, so React's post-submit form reset doesn't wipe them. */
function keep(form: FormData, result: FormState): FormState {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !SECRET_FIELDS.has(key) && !key.startsWith("$")) values[key] = value;
  }
  return { ...result, values };
}

const db = () => createServiceClient();
const text = (form: FormData, key: string, max = 300) => String(form.get(key) ?? "").trim().slice(0, max);
const nullable = (value: string) => (value ? value : null);
const slowDown = () => new Promise((resolve) => setTimeout(resolve, 700));
const now = () => new Date().toISOString();

const SIGN_IN_LIMITS = (email: string, ip: string) => [
  { key: `signin-email:${email}`, max: 8, windowMinutes: 15 },
  { key: `signin-ip:${ip}`, max: 30, windowMinutes: 15 },
];
const SIGN_UP_LIMIT = (ip: string) => [{ key: `signup-ip:${ip}`, max: 10, windowMinutes: 60 }];
const TOO_MANY = "Too many attempts. Please wait 15 minutes and try again.";
const UNIQUE_VIOLATION = "23505";
const DUPLICATE = "An account with this email already exists. Try signing in.";

async function startSession(id: string, role: AccountRole, passwordHash: string) {
  (await cookies()).set(ACCOUNT_COOKIE, createAccountToken(id, role, passwordHash), accountCookieOptions);
}

async function emailTaken(email: string) {
  const { data } = await db().from(ACCOUNT_TABLES.accounts).select("id").eq("email", email).maybeSingle();
  return Boolean(data);
}

/**
 * Creates the account row and its profile row together. If the profile can't
 * be saved, the account is removed again so nobody is left half-registered.
 */
async function createAccount(
  email: string,
  passwordHash: string,
  role: AccountRole,
  status: "approved" | "pending",
  profile: Record<string, unknown>,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await db().from(ACCOUNT_TABLES.accounts).insert({ email, password_hash: passwordHash, role, status }).select("id").single();
  if (error?.code === UNIQUE_VIOLATION) return { error: DUPLICATE };
  if (error || !data) return { error: "Sorry, we couldn’t create your account. Please try again." };
  const table = role === "consultant" ? ACCOUNT_TABLES.consultants : ACCOUNT_TABLES.companies;
  const { error: profileError } = await db().from(table).insert({ account_id: data.id, ...profile });
  if (profileError) {
    await db().from(ACCOUNT_TABLES.accounts).delete().eq("id", data.id);
    return { error: "Sorry, we couldn’t create your account. Please try again." };
  }
  return { id: data.id };
}

/* ---------- sign up ---------- */

export async function signUpConsultant(prev: FormState, form: FormData): Promise<FormState> {
  return keep(form, await safely(() => signUpConsultantInner(prev, form)));
}

async function signUpConsultantInner(_prev: FormState, form: FormData): Promise<FormState> {
  if (text(form, "website_url")) return { error: null }; // honeypot
  const fullName = text(form, "full_name", 120);
  const email = text(form, "email", 200).toLowerCase();
  const password = String(form.get("password") ?? "");
  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.full_name = "Please enter your full name.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Please enter a valid email address.";
  const pw = passwordProblem(password);
  if (pw) fieldErrors.password = pw;
  if (form.get("terms") !== "on") fieldErrors.terms = "Please agree to continue.";
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };

  const ip = await clientIp();
  if (await isLimited(SIGN_UP_LIMIT(ip))) return { error: TOO_MANY };
  if (await emailTaken(email)) return { error: DUPLICATE };

  const passwordHash = await hashPassword(password);
  // Consultants can use their account straight away; their profile goes live only after admin approval.
  const created = await createAccount(email, passwordHash, "consultant", "approved", { full_name: fullName });
  if ("error" in created) return { error: created.error };
  await recordAttempt([`signup-ip:${ip}`]);
  await startSession(created.id, "consultant", passwordHash);
  redirect("/account");
}

export async function signUpCompany(prev: FormState, form: FormData): Promise<FormState> {
  return keep(form, await safely(() => signUpCompanyInner(prev, form)));
}

async function signUpCompanyInner(_prev: FormState, form: FormData): Promise<FormState> {
  if (text(form, "website_url")) return { error: null }; // honeypot
  const values = {
    company_name: text(form, "company_name", 160),
    website: text(form, "website", 300),
    industry: text(form, "industry", 120),
    city: text(form, "city", 80),
    employee_count: text(form, "employee_count", 40),
    contact_name: text(form, "contact_name", 120),
    contact_role: text(form, "contact_role", 120),
    phone: text(form, "phone", 30),
  };
  const email = text(form, "email", 200).toLowerCase();
  const password = String(form.get("password") ?? "");
  const website = values.website ? normaliseUrl(values.website) : null;
  const fieldErrors: Record<string, string> = {};
  if (!values.company_name) fieldErrors.company_name = "Please enter your company name.";
  if (!values.contact_name) fieldErrors.contact_name = "Please enter your name.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Please enter a valid email address.";
  else if (!isWorkEmail(email)) fieldErrors.email = "Please use your company email address (not Gmail, Yahoo, Outlook or similar).";
  if (values.website && !website) fieldErrors.website = "Please enter a web address, e.g. yourcompany.com";
  if (values.phone && !isPhone(values.phone)) fieldErrors.phone = "Please enter a valid phone number.";
  if (values.employee_count && !EMPLOYEE_BANDS.includes(values.employee_count as never)) fieldErrors.employee_count = "Please choose from the list.";
  if (values.city && !CITIES.includes(values.city as never)) fieldErrors.city = "Please choose from the list.";
  const pw = passwordProblem(password);
  if (pw) fieldErrors.password = pw;
  if (form.get("terms") !== "on") fieldErrors.terms = "Please agree to continue.";
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };

  const ip = await clientIp();
  if (await isLimited(SIGN_UP_LIMIT(ip))) return { error: TOO_MANY };
  if (await emailTaken(email)) return { error: DUPLICATE };

  const passwordHash = await hashPassword(password);
  const created = await createAccount(email, passwordHash, "company", "pending", {
    email_domain: emailDomain(email),
    company_name: values.company_name,
    contact_name: values.contact_name,
    website,
    industry: nullable(values.industry),
    city: nullable(values.city),
    employee_count: nullable(values.employee_count),
    contact_role: nullable(values.contact_role),
    phone: nullable(values.phone),
  });
  if ("error" in created) return { error: created.error };
  await recordAttempt([`signup-ip:${ip}`]);
  await startSession(created.id, "company", passwordHash);
  redirect("/account");
}

/* ---------- sign in / out ---------- */

export async function signInAccount(prev: FormState, form: FormData): Promise<FormState> {
  return keep(form, await safely(() => signInAccountInner(prev, form)));
}

async function signInAccountInner(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 200).toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };

  const ip = await clientIp();
  const limits = SIGN_IN_LIMITS(email, ip);
  if (await isLimited(limits)) return { error: TOO_MANY };

  const { data } = await db()
    .from(ACCOUNT_TABLES.accounts)
    .select("id, role, status, password_hash")
    .eq("email", email)
    .maybeSingle();
  if (!data || !(await verifyPassword(password, data.password_hash))) {
    await recordAttempt(limits.map((l) => l.key));
    await slowDown();
    return { error: "That email and password don’t match. Please try again." };
  }
  if (data.status === "suspended") return { error: "This account has been paused. Please contact Axon Arbor." };
  await clearAttempts([`signin-email:${email}`]);
  await db().from(ACCOUNT_TABLES.accounts).update({ last_login_at: now() }).eq("id", data.id);
  await startSession(data.id, data.role as AccountRole, data.password_hash);
  redirect("/account");
}

export async function signOutAccount() {
  (await cookies()).delete({ name: ACCOUNT_COOKIE, path: "/" });
  redirect("/sign-in");
}

export async function changePassword(prev: FormState, form: FormData): Promise<FormState> {
  return safely(() => changePasswordInner(prev, form));
}

async function changePasswordInner(_prev: FormState, form: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Please sign in again." };
  const current = String(form.get("current_password") ?? "");
  const next = String(form.get("new_password") ?? "");
  const limits = [{ key: `password-change:${account.id}`, max: 8, windowMinutes: 15 }];
  if (await isLimited(limits)) return { error: TOO_MANY };
  const { data } = await db().from(ACCOUNT_TABLES.accounts).select("password_hash").eq("id", account.id).single();
  if (!data || !(await verifyPassword(current, data.password_hash))) {
    await recordAttempt(limits.map((l) => l.key));
    return { error: "Your current password isn’t right." };
  }
  const pw = passwordProblem(next);
  if (pw) return { error: pw };
  if (next === current) return { error: "Choose a password different from your current one." };
  const passwordHash = await hashPassword(next);
  const { error } = await db().from(ACCOUNT_TABLES.accounts).update({ password_hash: passwordHash, updated_at: now() }).eq("id", account.id);
  if (error) return { error: "Sorry, we couldn’t change your password. Please try again." };
  // Other devices are signed out (their sessions belong to the old password); this one continues.
  await startSession(account.id, account.role, passwordHash);
  return { error: null, ok: "Password changed. You’ve been signed out on any other devices." };
}

/* ---------- consultant profile ---------- */

const REQUIRED_PROFILE_FIELDS = ["full_name", "phone", "city", "expertise", "years_experience", "industries", "delivery_mode", "languages", "bio"] as const;

/** Photos must be ones this consultant uploaded to our storage. */
const photoPrefix = (accountId: string) => `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/consultants/${accountId}/`;
const photoPath = (url: string) => url.split(`/object/public/${MEDIA_BUCKET}/`)[1];

function readProfile(form: FormData) {
  const expertise = [text(form, "expertise_1", 80), text(form, "expertise_2", 80), text(form, "expertise_3", 80)]
    .filter(Boolean)
    .filter((e, i, all) => all.indexOf(e) === i);
  const years = text(form, "years_experience", 3);
  const linkedin = text(form, "linkedin_url", 300);
  return {
    full_name: text(form, "full_name", 120),
    phone: nullable(text(form, "phone", 30)),
    city: nullable(text(form, "city", 80)),
    expertise,
    years_experience: years === "" ? null : Number(years),
    industries: nullable(text(form, "industries", 300)),
    delivery_mode: nullable(text(form, "delivery_mode", 20)),
    languages: nullable(text(form, "languages", 200)),
    bio: nullable(text(form, "bio", 600)),
    linkedin_url: linkedin ? (normaliseUrl(linkedin) ?? linkedin) : null,
    certifications: nullable(text(form, "certifications", 300)),
    notable_clients: nullable(text(form, "notable_clients", 300)),
    day_rate_band: nullable(text(form, "day_rate_band", 60)),
    availability: nullable(text(form, "availability", 120)),
    photo_url: nullable(text(form, "photo_url", 500)),
    consent: form.get("consent") === "on",
  };
}

function profileErrors(p: ReturnType<typeof readProfile>, submitting: boolean, accountId: string) {
  const e: Record<string, string> = {};
  if (p.phone && !isPhone(p.phone)) e.phone = "Please enter a valid phone number.";
  if (p.city && !CITIES.includes(p.city as never)) e.city = "Please choose from the list.";
  if (p.expertise.some((x) => !EXPERTISE.includes(x as never))) e.expertise_1 = "Please choose from the list.";
  if (p.delivery_mode && !DELIVERY_MODES.includes(p.delivery_mode as never)) e.delivery_mode = "Please choose from the list.";
  if (p.day_rate_band && !DAY_RATE_BANDS.includes(p.day_rate_band as never)) e.day_rate_band = "Please choose from the list.";
  if (p.years_experience !== null && (!Number.isInteger(p.years_experience) || p.years_experience < 0 || p.years_experience > 60)) {
    e.years_experience = "Enter a whole number between 0 and 60.";
  }
  if (p.linkedin_url && (!normaliseUrl(p.linkedin_url) || !isLinkedIn(p.linkedin_url))) {
    e.linkedin_url = "Please paste your LinkedIn profile link, e.g. linkedin.com/in/yourname";
  }
  if (p.photo_url && !p.photo_url.startsWith(photoPrefix(accountId))) p.photo_url = null; // ignore anything not uploaded here
  if (submitting) {
    for (const key of REQUIRED_PROFILE_FIELDS) {
      const v = p[key];
      if (v === null || v === "" || (Array.isArray(v) && v.length === 0)) e[key === "expertise" ? "expertise_1" : key] = "Required before you submit.";
    }
    if (!p.consent) e.consent = "Please agree so we can share your profile with companies.";
  }
  return e;
}

/** intent: "save" keeps a draft; "submit" sends the profile to Axon Arbor for approval. */
export async function saveConsultantProfile(prev: FormState, form: FormData): Promise<FormState> {
  return keep(form, await safely(() => saveConsultantProfileInner(prev, form)));
}

async function saveConsultantProfileInner(_prev: FormState, form: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account || account.role !== "consultant") return { error: "Please sign in again." };
  const current = await getConsultantProfile(account.id);
  const submitting = form.get("intent") === "submit";
  const profile = readProfile(form);
  const fieldErrors = profileErrors(profile, submitting, account.id);
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };

  const status = current?.profile_status ?? "draft";
  // Submitting (or editing a live profile) sends it back to Axon Arbor for review.
  const nextStatus = submitting || status === "live" ? "pending" : status === "removed" ? "draft" : status;
  const { error } = await db()
    .from(ACCOUNT_TABLES.consultants)
    .update({
      ...profile,
      profile_status: nextStatus,
      submitted_at: nextStatus === "pending" ? now() : (current?.submitted_at ?? null),
      updated_at: now(),
    })
    .eq("account_id", account.id);
  if (error) return { error: "Sorry, we couldn’t save your profile. Please try again." };

  // Remove the previous photo from storage once it has been replaced or cleared.
  const oldPhoto = current?.photo_url;
  if (oldPhoto && oldPhoto !== profile.photo_url && oldPhoto.startsWith(photoPrefix(account.id))) {
    const path = photoPath(oldPhoto);
    if (path) await db().storage.from(MEDIA_BUCKET).remove([path]);
  }

  refresh();
  return {
    error: null,
    ok:
      nextStatus === "pending"
        ? "Saved and sent to Axon Arbor for approval. We’ll review it shortly."
        : "Draft saved. Submit it for approval when you’re ready.",
  };
}

export async function requestProfileRemoval(): Promise<FormState> {
  return safely(requestProfileRemovalInner);
}

async function requestProfileRemovalInner(): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account || account.role !== "consultant") return { error: "Please sign in again." };
  const { error } = await db()
    .from(ACCOUNT_TABLES.consultants)
    .update({ profile_status: "removal_requested", updated_at: now() })
    .eq("account_id", account.id)
    .in("profile_status", ["live", "pending"]);
  if (error) return { error: "Sorry, something went wrong. Please try again." };
  refresh();
  return { error: null, ok: "Removal requested. Axon Arbor will confirm shortly." };
}

export async function createProfilePhotoUpload(file: { type: string; size: number }) {
  try {
    return await createProfilePhotoUploadInner(file);
  } catch (error) {
    console.error("[account]", error);
    return { ok: false as const, error: "Upload failed. Please try again." };
  }
}

async function createProfilePhotoUploadInner(file: { type: string; size: number }) {
  const account = await getCurrentAccount();
  if (!account || account.role !== "consultant") return { ok: false as const, error: "Please sign in again." };
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  if (!ext) return { ok: false as const, error: "Please choose a JPG, PNG or WebP photo." };
  if (file.size > 5 * 1024 * 1024) return { ok: false as const, error: "Photos must be smaller than 5 MB." };
  const limits = [{ key: `photo-upload:${account.id}`, max: 20, windowMinutes: 60 }];
  if (await isLimited(limits)) return { ok: false as const, error: "Too many uploads. Please try again later." };
  await recordAttempt(limits.map((l) => l.key));
  const path = `consultants/${account.id}/${Date.now()}.${ext}`;
  const bucket = createServiceClient().storage.from(MEDIA_BUCKET);
  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error || !data) return { ok: false as const, error: "Upload failed. Please try again." };
  return { ok: true as const, path: data.path, token: data.token, publicUrl: bucket.getPublicUrl(data.path).data.publicUrl };
}

/* ---------- company profile ---------- */

export async function saveCompanyProfile(prev: FormState, form: FormData): Promise<FormState> {
  return keep(form, await safely(() => saveCompanyProfileInner(prev, form)));
}

async function saveCompanyProfileInner(_prev: FormState, form: FormData): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account || account.role !== "company") return { error: "Please sign in again." };
  const companyName = text(form, "company_name", 160);
  const contactName = text(form, "contact_name", 120);
  const websiteRaw = text(form, "website", 300);
  const website = websiteRaw ? normaliseUrl(websiteRaw) : null;
  const phone = text(form, "phone", 30);
  const employeeCount = text(form, "employee_count", 40);
  const city = text(form, "city", 80);
  const fieldErrors: Record<string, string> = {};
  if (!companyName) fieldErrors.company_name = "Please enter your company name.";
  if (!contactName) fieldErrors.contact_name = "Please enter your name.";
  if (websiteRaw && !website) fieldErrors.website = "Please enter a web address, e.g. yourcompany.com";
  if (phone && !isPhone(phone)) fieldErrors.phone = "Please enter a valid phone number.";
  if (employeeCount && !EMPLOYEE_BANDS.includes(employeeCount as never)) fieldErrors.employee_count = "Please choose from the list.";
  if (city && !CITIES.includes(city as never)) fieldErrors.city = "Please choose from the list.";
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };
  const { error } = await db()
    .from(ACCOUNT_TABLES.companies)
    .update({
      company_name: companyName,
      contact_name: contactName,
      website,
      industry: nullable(text(form, "industry", 120)),
      city: nullable(city),
      employee_count: nullable(employeeCount),
      contact_role: nullable(text(form, "contact_role", 120)),
      phone: nullable(phone),
      updated_at: now(),
    })
    .eq("account_id", account.id);
  if (error) return { error: "Sorry, we couldn’t save. Please try again." };
  refresh();
  return { error: null, ok: "Company details saved." };
}

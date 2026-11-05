/**
 * Choice lists shared by the consultant profile, company sign-up and the
 * consultant Excel template, so collected data imports cleanly.
 */

export const EXPERTISE = [
  "Leadership Development",
  "Behavioural Training",
  "Psychometric Assessments",
  "Executive Coaching",
  "Power BI",
  "Excel",
  "Gen AI",
  "Quality",
  "Lean Six Sigma",
  "POSH",
  "Diversity, Equity & Inclusion",
  "CSR Strategy",
  "Team Building",
  "CXO Offsites",
  "Design Thinking & Innovation",
  "Communications & HR Branding",
  "Hospitality & Service Excellence",
  "Sales Training",
  "Executive Presence & Communication",
  "Organisation Development",
  "Corporate Finance",
] as const;

/** Services a consultant can mark an interest in. The expertise list until Axon Arbor confirms its own. */
export const SERVICES = EXPERTISE;

export const CITIES = [
  "Delhi NCR",
  "Mumbai",
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Chandigarh",
  "Other (India)",
  "Outside India",
] as const;

export const DELIVERY_MODES = ["In person", "Online", "Both"] as const;

export const DAY_RATE_BANDS = [
  "Below ₹25,000 / day",
  "₹25,000–50,000 / day",
  "₹50,000–1,00,000 / day",
  "Above ₹1,00,000 / day",
  "Prefer not to say",
] as const;

export const EMPLOYEE_BANDS = ["1–50", "51–200", "201–1,000", "1,001–5,000", "5,001–20,000", "20,000+"] as const;

/** Free and personal email providers: company sign-up requires a work address. */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.in", "ymail.com", "rocketmail.com",
  "outlook.com", "outlook.in", "hotmail.com", "hotmail.co.in", "live.com", "live.in", "msn.com",
  "icloud.com", "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me", "pm.me",
  "rediffmail.com", "rediff.com", "zoho.com", "zohomail.in", "zohomail.com", "yandex.com", "yandex.ru",
  "gmx.com", "gmx.net", "mail.com", "inbox.com", "tutanota.com", "tuta.io", "hey.com", "fastmail.com",
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "temp-mail.org", "yopmail.com", "sharklasers.com",
]);

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

/** True for addresses on a company domain (not a free or disposable provider). */
export function isWorkEmail(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain || !domain.includes(".")) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

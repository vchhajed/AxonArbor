import { CITIES, DAY_RATE_BANDS, DELIVERY_MODES, EMAIL_RE, EXPERTISE, SERVICES } from "./options";
import { isLinkedIn, isPhone, normaliseUrl } from "./validate";

/** One consultant from the Excel template. */
export type ImportRow = {
  row: number;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  expertise_1: string;
  expertise_2: string;
  expertise_3: string;
  years_experience: string;
  industries: string;
  delivery_mode: string;
  languages: string;
  bio: string;
  linkedin_url: string;
  certifications: string;
  notable_clients: string;
  day_rate_band: string;
  availability: string;
  consent: string;
  services: string;
};

type Field = Exclude<keyof ImportRow, "row">;

/** Template headers (without the required "*") and the field each one fills. */
const COLUMNS: [string, Field][] = [
  ["full name", "full_name"],
  ["email", "email"],
  ["mobile number", "phone"],
  ["city", "city"],
  ["main expertise", "expertise_1"],
  ["expertise 2", "expertise_2"],
  ["expertise 3", "expertise_3"],
  ["years of experience", "years_experience"],
  ["industries", "industries"],
  ["delivery mode", "delivery_mode"],
  ["languages", "languages"],
  ["short bio", "bio"],
  ["linkedin", "linkedin_url"],
  ["certifications", "certifications"],
  ["notable clients", "notable_clients"],
  ["day rate", "day_rate_band"],
  ["availability", "availability"],
  ["consent", "consent"],
  ["services", "services"],
];

const EXAMPLE_EMAIL = "ananya.mehta@example.com";

/** Finds the header row, maps the columns and skips blank rows and the template's example. */
export function parseTemplate(data: unknown[][]): { rows: ImportRow[] } | { error: string } {
  const cell = (value: unknown) => (value === null || value === undefined ? "" : String(value).trim());
  const headerIndex = data.findIndex((r) => cell(r[0]).toLowerCase().startsWith("full name"));
  if (headerIndex < 0) return { error: "This doesn’t look like the consultant template: there’s no “Full name” column." };

  const headers = data[headerIndex].map((h) => cell(h).toLowerCase());
  const positions = COLUMNS.map(([label, field]) => [field, headers.findIndex((h) => h.startsWith(label))] as const);
  const rows: ImportRow[] = [];
  data.slice(headerIndex + 1).forEach((r, i) => {
    const entry = { row: headerIndex + i + 2 } as ImportRow;
    for (const [field, index] of positions) entry[field] = index < 0 ? "" : cell(r[index]);
    if (!entry.full_name && !entry.email) return;
    if (entry.email.toLowerCase() === EXAMPLE_EMAIL) return;
    rows.push(entry);
  });
  return { rows };
}

export const splitServices = (value: string) =>
  value
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);

/** The first thing wrong with a row, or null if it can be imported. */
export function rowProblem(r: ImportRow): string | null {
  if (!r.full_name) return "Name is missing";
  if (!EMAIL_RE.test(r.email.toLowerCase())) return "Email isn’t valid";
  if (r.phone && !isPhone(r.phone)) return "Phone number isn’t valid";
  if (r.city && !CITIES.includes(r.city as never)) return `City “${r.city}” isn’t on the list`;
  for (const e of [r.expertise_1, r.expertise_2, r.expertise_3]) {
    if (e && !EXPERTISE.includes(e as never)) return `Expertise “${e}” isn’t on the list`;
  }
  const years = Number(r.years_experience);
  if (r.years_experience && (!Number.isInteger(years) || years < 0 || years > 60)) return "Years of experience must be a whole number from 0 to 60";
  if (r.delivery_mode && !DELIVERY_MODES.includes(r.delivery_mode as never)) return `Delivery mode “${r.delivery_mode}” isn’t on the list`;
  if (r.day_rate_band && !DAY_RATE_BANDS.includes(r.day_rate_band as never)) return `Day rate “${r.day_rate_band}” isn’t on the list`;
  if (r.linkedin_url && !(normaliseUrl(r.linkedin_url) && isLinkedIn(normaliseUrl(r.linkedin_url) as string))) return "LinkedIn link isn’t valid";
  if (r.bio.length > 600) return "Bio is longer than 600 characters";
  const unknown = splitServices(r.services).find((s) => !SERVICES.includes(s as never));
  if (unknown) return `Service “${unknown}” isn’t on the list`;
  return null;
}

/** Small validators shared by the account forms (server-side). */

/** Returns a normalised http(s) URL, or null if the value isn't a usable web address. Adds https:// when missing. */
export function normaliseUrl(value: string): string | null {
  const raw = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Accepts international numbers: digits with optional +, spaces, dashes, dots and brackets; 7–15 digits. */
export function isPhone(value: string): boolean {
  if (!/^\+?[\d\s\-().]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}

export function isLinkedIn(url: string): boolean {
  try {
    return /(^|\.)linkedin\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

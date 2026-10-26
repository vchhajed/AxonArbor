type Json = unknown;

const isObject = (value: Json): value is Record<string, Json> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * A blank copy of a value's shape: strings emptied, numbers zeroed, arrays
 * emptied. Used as the template for items an admin adds to a list.
 */
export function blankOf(value: Json): Json {
  if (Array.isArray(value)) return [];
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, blankOf(v)]));
  }
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return value;
}

/** Union of every key seen across a list's object items, blanked. */
export function itemTemplate(items: Json[]): Record<string, Json> | null {
  const objects = items.filter(isObject);
  if (objects.length === 0) return null;
  const template: Record<string, Json> = {};
  for (const item of objects) {
    for (const [k, v] of Object.entries(item)) {
      if (!(k in template)) template[k] = blankOf(v);
    }
  }
  return template;
}

/**
 * Overlays stored (admin-edited) content on the code defaults.
 *
 * - Objects merge key by key, so fields added to the code later still appear.
 * - Lists come from the stored copy (admins can add, remove and reorder),
 *   with each item filled out to the full shape of the default items.
 * - Values of the wrong type are ignored in favour of the default.
 */
export function mergeContent<T>(base: T, stored: Json): T {
  if (stored === undefined || stored === null) return base;

  if (Array.isArray(base)) {
    if (!Array.isArray(stored)) return base;
    const template = itemTemplate(base);
    return stored.map((item) =>
      template && isObject(item) ? mergeContent(template, item) : item,
    ) as T;
  }

  if (isObject(base)) {
    if (!isObject(stored)) return base;
    const result: Record<string, Json> = { ...stored };
    for (const [k, v] of Object.entries(base)) {
      result[k] = mergeContent(v, stored[k]);
    }
    return result as T;
  }

  if (base === undefined) return stored as T;
  return (typeof stored === typeof base ? stored : base) as T;
}

/**
 * True when every value in `stored` equals the same value in `old`. Fields
 * added to the defaults after a section was saved don't count as edits.
 */
function unchangedFrom(stored: Json, old: Json): boolean {
  if (stored === old) return true;
  if (Array.isArray(stored) && Array.isArray(old)) {
    return stored.length === old.length && stored.every((v, i) => unchangedFrom(v, old[i]));
  }
  if (isObject(stored) && isObject(old)) {
    return Object.keys(stored).every((k) => k in old && unchangedFrom(stored[k], old[k]));
  }
  return false;
}

/**
 * Merges a stored content document over its defaults (see mergeContent), and
 * also:
 * - drops top-level sections the code no longer has, so retired sections
 *   don't linger in the admin's forms;
 * - ignores a stored section that still equals an earlier default exactly
 *   (`retired`, ignoring fields added since), so untouched sections pick up
 *   new default copy.
 */
export function mergeDocument<T extends Record<string, Json>>(
  base: T,
  stored: Json,
  retired: Record<string, Json[]> = {},
): T {
  if (!isObject(stored)) return base;
  const kept: Record<string, Json> = {};
  for (const key of Object.keys(base)) {
    if (!(key in stored)) continue;
    if (retired[key]?.some((old) => unchangedFrom(stored[key], old))) continue;
    kept[key] = stored[key];
  }
  return mergeContent(base, kept);
}

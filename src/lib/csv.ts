/**
 * One quoted CSV cell. Text that a spreadsheet would run as a formula is
 * prefixed with an apostrophe; phone numbers such as +91 98765 43210 stay as they are.
 */
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=@\t\r]/.test(text) || /^[+-](?![\d\s().-]*$)/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

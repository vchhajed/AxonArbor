"use client";

import { useRouter } from "next/navigation";
import readExcelFile from "read-excel-file/browser";
import { useRef, useState } from "react";
import { importConsultants, type ImportResult } from "@/app/admin/import-actions";
import { parseTemplate, type ImportRow } from "@/lib/phase2/import";
import { AdminButton } from "./ui";

const BATCH = 25;

/** Loads consultants from the filled-in Excel template. */
export function ConsultantImport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResult[] | null>(null);

  async function choose(file: File) {
    setError(null);
    setResults(null);
    setRows(null);
    setFileName(file.name);
    try {
      const sheets = await readExcelFile(file);
      const sheet = sheets.find((s) => s.sheet === "Consultants") ?? sheets[0];
      const parsed = parseTemplate(sheet.data as unknown[][]);
      if ("error" in parsed) setError(parsed.error);
      else if (parsed.rows.length === 0) setError("There are no consultants in this file yet.");
      else setRows(parsed.rows);
    } catch {
      setError("Couldn’t read that file. Please choose the filled-in .xlsx template.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function run() {
    if (!rows) return;
    const all: ImportResult[] = [];
    for (let i = 0; i < rows.length; i += BATCH) {
      setProgress(`Importing ${Math.min(i + BATCH, rows.length)} of ${rows.length}…`);
      const result = await importConsultants(rows.slice(i, i + BATCH)).catch(() => ({ ok: false as const, error: "Couldn’t reach the server. Please try again." }));
      if (!result.ok) {
        setError(result.error);
        break;
      }
      all.push(...result.results);
    }
    setProgress(null);
    setRows(null);
    setResults(all);
    router.refresh();
  }

  function downloadLinks() {
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = (results ?? []).filter((r) => r.created).map((r) => [r.name, r.email, r.link].map(escape).join(","));
    const blob = new Blob([["name,email,set_password_link", ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "axon-arbor-consultant-invites.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const created = results?.filter((r) => r.created).length ?? 0;
  const skipped = results?.filter((r) => !r.created) ?? [];

  return (
    <section aria-label="Import consultants" className="mt-6 border border-grey-200 bg-paper p-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-56 flex-1 text-sm text-grey-600">
          Load consultants from the Excel template. Each gets an account and a draft profile; nothing goes live until it’s reviewed.
        </p>
        <AdminButton size="sm" onClick={() => fileRef.current?.click()} disabled={Boolean(progress)}>
          Import from Excel
        </AdminButton>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          aria-label="Excel template"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && choose(e.target.files[0])}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 border-l-4 border-amber bg-grey-50 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {rows && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-grey-100 pt-4">
          <p className="flex-1 text-sm">
            <strong>{rows.length}</strong> consultant{rows.length === 1 ? "" : "s"} found in {fileName}.
          </p>
          <AdminButton variant="primary" size="sm" onClick={run} disabled={Boolean(progress)}>
            {progress ?? "Import now"}
          </AdminButton>
        </div>
      )}

      {results && (
        <div className="mt-4 border-t border-grey-100 pt-4 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1">
              <strong>{created}</strong> imported, <strong>{skipped.length}</strong> skipped.
            </p>
            {created > 0 && (
              <AdminButton size="sm" onClick={downloadLinks}>
                Download invite links
              </AdminButton>
            )}
          </div>
          {skipped.length > 0 && (
            <ul className="mt-3 space-y-1 text-grey-700">
              {skipped.map((r) => (
                <li key={r.row}>
                  Row {r.row}, {r.name || r.email || "no name"}: {r.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

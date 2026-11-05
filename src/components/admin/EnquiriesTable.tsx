"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteSubmission, updateSubmission } from "@/app/admin/actions";
import type { Submission } from "@/lib/admin/data";
import { csvCell } from "@/lib/csv";
import { AdminButton, ConfirmDialog, formatDate, Toast } from "./ui";

const FILTERS = [
  { value: "inbox", label: "Inbox" },
  { value: "new", label: "New" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

function toCsv(rows: Submission[]) {
  const cols = ["created_at", "name", "organisation", "role", "email", "phone", "message", "status", "notes"] as const;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n");
}

export function EnquiriesTable({ submissions }: { submissions: Submission[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("inbox");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(params.get("open"));
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<Submission | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return submissions.filter((s) => {
      if (filter === "inbox" && s.status === "archived") return false;
      if (filter === "new" && s.status !== "new") return false;
      if (filter === "archived" && s.status !== "archived") return false;
      if (!q) return true;
      return [s.name, s.organisation, s.email, s.message, s.role, s.phone].some((v) => v?.toLowerCase().includes(q));
    });
  }, [submissions, filter, query]);

  async function act(promise: Promise<{ ok: boolean; error?: string }>, done: string) {
    const result = await promise;
    setToast(result.ok ? done : (result.error ?? "Something went wrong."));
    setTimeout(() => setToast(null), 3000);
    router.refresh();
  }

  function open(s: Submission) {
    const next = openId === s.id ? null : s.id;
    setOpenId(next);
    if (next && s.status === "new") void act(updateSubmission(s.id, { status: "read" }), "Marked as read");
  }

  function download() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `axon-arbor-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Filter enquiries" className="flex border border-grey-200 bg-paper">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 text-sm ${filter === f.value ? "bg-ink text-paper" : "text-grey-700 hover:bg-grey-100"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, company, email or message"
          aria-label="Search enquiries"
          className="min-w-64 flex-1 border border-grey-200 bg-paper px-4 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <AdminButton size="sm" onClick={download} disabled={rows.length === 0}>
          Download CSV
        </AdminButton>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 border border-dashed border-grey-300 bg-paper p-8 text-center text-grey-600">
          {submissions.length === 0 ? "No enquiries yet." : "No enquiries match this view."}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-grey-200 border border-grey-200 bg-paper">
          {rows.map((s) => {
            const isOpen = openId === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => open(s)}
                  aria-expanded={isOpen}
                  className="grid w-full gap-1 px-5 py-4 text-left transition-colors hover:bg-grey-50 md:grid-cols-[1fr_1fr_auto] md:items-center md:gap-6"
                >
                  <span className="flex items-center gap-2">
                    {s.status === "new" && <span aria-label="New" className="size-2 shrink-0 rounded-full bg-amber" />}
                    <span className={s.status === "new" ? "font-semibold" : "font-medium"}>{s.name}</span>
                    <span className="truncate text-sm text-grey-500">{s.organisation}</span>
                  </span>
                  <span className="line-clamp-1 text-sm text-grey-600">{s.message}</span>
                  <span className="text-xs text-grey-500">{formatDate(s.created_at)}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-grey-100 bg-grey-50 px-5 py-6">
                    <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ["Email", <a key="e" href={`mailto:${s.email}`} className="underline underline-offset-4">{s.email}</a>],
                        ["Phone", s.phone ? <a key="p" href={`tel:${s.phone}`} className="underline underline-offset-4">{s.phone}</a> : "—"],
                        ["Organisation", s.organisation],
                        ["Role", s.role || "—"],
                      ].map(([label, value]) => (
                        <div key={String(label)}>
                          <dt className="eyebrow text-grey-500">{label}</dt>
                          <dd className="mt-1 break-words">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-6">
                      <p className="eyebrow text-grey-500">Message</p>
                      <p className="mt-2 leading-relaxed whitespace-pre-wrap">{s.message}</p>
                    </div>
                    <div className="mt-6">
                      <label htmlFor={`notes-${s.id}`} className="eyebrow text-grey-500">
                        Private notes
                      </label>
                      <textarea
                        id={`notes-${s.id}`}
                        rows={2}
                        defaultValue={s.notes ?? ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [s.id]: e.target.value }))}
                        placeholder="Only admins can see these notes."
                        className="mt-2 block w-full border border-grey-200 bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
                      />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <a
                        href={`mailto:${s.email}?subject=${encodeURIComponent("Re: your enquiry to Axon Arbor")}`}
                        className="inline-flex items-center bg-ink px-4 py-2 font-label text-[0.65rem] font-semibold tracking-[0.12em] text-paper uppercase hover:bg-amber hover:text-ink"
                      >
                        Reply by email
                      </a>
                      {s.id in notes && (
                        <AdminButton size="sm" variant="primary" onClick={() => act(updateSubmission(s.id, { notes: notes[s.id] || null }), "Notes saved")}>
                          Save notes
                        </AdminButton>
                      )}
                      {s.status !== "archived" ? (
                        <AdminButton size="sm" onClick={() => act(updateSubmission(s.id, { status: "archived" }), "Archived")}>
                          Archive
                        </AdminButton>
                      ) : (
                        <AdminButton size="sm" onClick={() => act(updateSubmission(s.id, { status: "read" }), "Moved to inbox")}>
                          Move to inbox
                        </AdminButton>
                      )}
                      {s.status !== "new" && (
                        <AdminButton size="sm" variant="ghost" onClick={() => act(updateSubmission(s.id, { status: "new" }), "Marked as unread")}>
                          Mark unread
                        </AdminButton>
                      )}
                      <AdminButton size="sm" variant="danger" className="ml-auto" onClick={() => setConfirmDelete(s)}>
                        Delete
                      </AdminButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this enquiry?"
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const s = confirmDelete!;
          setConfirmDelete(null);
          void act(deleteSubmission(s.id), "Enquiry deleted");
        }}
      >
        The enquiry from {confirmDelete?.name} will be removed permanently. Consider archiving it instead.
      </ConfirmDialog>
      <Toast message={toast} />
    </div>
  );
}

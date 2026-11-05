"use client";

/* eslint-disable @next/next/no-img-element -- consultant photos uploaded at runtime */
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { addAccount, deleteAccount, resetAccountPassword, setAccountManager, reviewCompany, reviewProfile, setAccountSuspended } from "@/app/admin/approval-actions";
import type { AdminAccountRow } from "@/lib/accounts/admin";
import type { ProfileStatus } from "@/lib/accounts/data";
import { csvCell } from "@/lib/csv";
import { AdminButton, ConfirmDialog, formatDate, Toast } from "./ui";

type Tab = "review" | "active" | "waiting" | "all";

const TABS: Record<"consultant" | "company", { value: Tab; label: string }[]> = {
  consultant: [
    { value: "review", label: "To review" },
    { value: "active", label: "Live" },
    { value: "waiting", label: "Not submitted yet" },
    { value: "all", label: "All" },
  ],
  company: [
    { value: "review", label: "To review" },
    { value: "active", label: "Approved" },
    { value: "all", label: "All" },
  ],
};

function inTab(r: AdminAccountRow, tab: Tab) {
  if (tab === "all") return true;
  if (tab === "review") return needsReview(r);
  const ps = r.consultant?.profile_status;
  if (tab === "active") return r.status !== "suspended" && (r.role === "company" ? r.status === "approved" : ps === "live");
  return r.role === "consultant" && (ps === "draft" || ps === "changes_requested");
}

const PROFILE_LABEL: Record<ProfileStatus, string> = {
  draft: "Not submitted",
  pending: "Waiting for approval",
  live: "Live",
  changes_requested: "Changes requested",
  removal_requested: "Removal requested",
  removed: "Removed",
};
const ACCOUNT_LABEL = { pending: "Waiting for approval", approved: "Approved", rejected: "Rejected", suspended: "Paused" };

type Pending =
  | { kind: "company"; row: AdminAccountRow; decision: "approve" | "reject" }
  | { kind: "profile"; row: AdminAccountRow; decision: "approve" | "changes" | "remove" | "keep" }
  | { kind: "suspend"; row: AdminAccountRow; suspended: boolean }
  | { kind: "reset"; row: AdminAccountRow }
  | { kind: "delete"; row: AdminAccountRow }
  | { kind: "manager"; row: AdminAccountRow };

/** Spreadsheet export; consultant columns match the Excel template. */
function toCsv(rows: AdminAccountRow[], role: "consultant" | "company") {
  const header =
    role === "consultant"
      ? ["full_name", "email", "phone", "city", "expertise_1", "expertise_2", "expertise_3", "years_experience", "industries", "delivery_mode", "languages", "bio", "linkedin_url", "certifications", "notable_clients", "day_rate_band", "availability", "photo", "consent", "services_of_interest", "profile_status", "account_status", "signed_up", "last_sign_in"]
      : ["company_name", "website", "industry", "city", "employee_count", "contact_name", "contact_role", "email", "email_confirmed", "phone", "email_domain", "account_manager", "account_status", "signed_up", "last_sign_in"];
  const lines = rows.map((r) => {
    const c = r.consultant;
    const co = r.company;
    const values =
      role === "consultant"
        ? [c?.full_name, r.email, c?.phone, c?.city, c?.expertise[0], c?.expertise[1], c?.expertise[2], c?.years_experience, c?.industries, c?.delivery_mode, c?.languages, c?.bio, c?.linkedin_url, c?.certifications, c?.notable_clients, c?.day_rate_band, c?.availability, c?.photo_url, c?.consent ? "Yes" : "No", c?.services_of_interest.join("; "), c?.profile_status, r.status, r.created_at, r.last_login_at]
        : [co?.company_name, co?.website, co?.industry, co?.city, co?.employee_count, co?.contact_name, co?.contact_role, r.email, co?.email_confirmed_at ? "Yes" : "No", co?.phone, co?.email_domain, co?.account_manager, r.status, r.created_at, r.last_login_at];
    return values.map(csvCell).join(",");
  });
  return [header.join(","), ...lines].join("\n");
}

const needsReview = (r: AdminAccountRow) =>
  (r.role === "company" && r.status === "pending") ||
  (r.role === "consultant" && (r.consultant?.profile_status === "pending" || r.consultant?.profile_status === "removal_requested"));

function name(r: AdminAccountRow) {
  return r.role === "consultant" ? (r.consultant?.full_name ?? r.email) : (r.company?.company_name ?? r.email);
}

function statusLabel(r: AdminAccountRow) {
  if (r.status === "suspended") return "Paused";
  if (r.role === "consultant") return r.consultant ? PROFILE_LABEL[r.consultant.profile_status] : "—";
  return ACCOUNT_LABEL[r.status];
}

function Badge({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 font-label text-[0.65rem] font-bold tracking-[0.08em] uppercase ${
        strong ? "bg-amber text-ink" : "bg-grey-100 text-grey-700"
      }`}
    >
      {children}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="eyebrow text-grey-500">{label}</dt>
      <dd className="mt-1 text-sm whitespace-pre-line text-ink">{value}</dd>
    </div>
  );
}

function Details({ row }: { row: AdminAccountRow }) {
  const c = row.consultant;
  const co = row.company;
  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      {c?.photo_url && <img src={c.photo_url} alt={`Photo of ${c.full_name}`} className="size-28 object-cover grayscale" />}
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Email" value={<a href={`mailto:${row.email}`} className="underline decoration-amber">{row.email}</a>} />
        <Detail label="Signed up" value={formatDate(row.created_at)} />
        <Detail label="Last sign-in" value={row.last_login_at ? formatDate(row.last_login_at) : "Never"} />
        {c && (
          <>
            <Detail label="Phone" value={c.phone} />
            <Detail label="City" value={c.city} />
            <Detail label="Years of experience" value={c.years_experience} />
            <Detail label="Expertise" value={c.expertise.join(", ")} />
            <Detail label="Industries" value={c.industries} />
            <Detail label="Delivery" value={c.delivery_mode} />
            <Detail label="Languages" value={c.languages} />
            <Detail label="Certifications" value={c.certifications} />
            <Detail label="Notable clients" value={c.notable_clients} />
            <Detail label="Day rate" value={c.day_rate_band} />
            <Detail label="Availability" value={c.availability} />
            <Detail
              label="LinkedIn"
              value={c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="underline decoration-amber">Open profile ↗</a>}
            />
            <Detail label="Consent to share" value={c.consent ? "Yes" : "No"} />
            <Detail label="Services of interest" value={c.services_of_interest.join(", ")} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Detail label="Bio" value={c.bio} />
            </div>
            <Detail label="Last note to consultant" value={c.review_note} />
          </>
        )}
        {co && (
          <>
            <Detail label="Contact" value={[co.contact_name, co.contact_role].filter(Boolean).join(", ")} />
            <Detail label="Phone" value={co.phone} />
            <Detail label="Email domain" value={co.email_domain} />
            <Detail label="Email confirmed" value={co.email_confirmed_at ? formatDate(co.email_confirmed_at) : "Not yet"} />
            <Detail
              label="Website"
              value={co.website && <a href={co.website} target="_blank" rel="noreferrer" className="underline decoration-amber">{co.website} ↗</a>}
            />
            <Detail label="Industry" value={co.industry} />
            <Detail label="Head office" value={co.city} />
            <Detail label="Employees" value={co.employee_count} />
            <Detail label="Account manager" value={co.account_manager ?? "Not assigned"} />
            <Detail label="Decision note" value={row.review_note} />
          </>
        )}
      </dl>
    </div>
  );
}

export function ApprovalsBoard({ rows, role }: { rows: AdminAccountRow[]; role: "consultant" | "company" }) {
  const tabs = TABS[role];
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("review");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "info" | "error" } | null>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({ name: "", email: "", companyName: "" });

  const counts = Object.fromEntries(tabs.map((t) => [t.value, rows.filter((r) => inTab(r, t.value)).length])) as Record<Tab, number>;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (!inTab(r, tab)) return false;
      if (!q) return true;
      return [r.email, name(r), r.consultant?.city, r.company?.industry, r.company?.contact_name, ...(r.consultant?.expertise ?? [])].some((v) => v?.toLowerCase().includes(q));
    });
  }, [rows, tab, query]);

  function ask(p: Pending, initialNote = "") {
    setNote(initialNote);
    setDialogError(null);
    setPending(p);
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    const p = pending;
    const run = () =>
      p.kind === "company"
        ? reviewCompany(p.row.id, p.decision, note)
        : p.kind === "profile"
          ? reviewProfile(p.row.id, p.decision, note)
          : p.kind === "suspend"
            ? setAccountSuspended(p.row.id, p.suspended)
            : p.kind === "delete"
              ? deleteAccount(p.row.id)
              : p.kind === "manager"
                ? setAccountManager(p.row.id, note)
                : resetAccountPassword(p.row.id);
    const result = await run().catch(() => ({ ok: false as const, error: "Couldn’t reach the server. Please try again." }));
    setBusy(false);
    if (!result.ok) {
      setDialogError(result.error);
      return;
    } else {
      setPending(null);
      if (p.kind === "reset" && result.password) setTempPassword({ email: p.row.email, password: result.password });
      else setToast({ message: "Saved", tone: "info" });
      router.refresh();
    }
    setTimeout(() => setToast(null), 3000);
  }

  const dialog = pending && describe(pending);

  async function add() {
    setBusy(true);
    const result = await addAccount({ role, ...newAccount }).catch(() => ({ ok: false as const, error: "Couldn’t reach the server. Please try again." }));
    setBusy(false);
    if (!result.ok) {
      setDialogError(result.error);
      return;
    }
    setAdding(false);
    if (result.password) setTempPassword({ email: newAccount.email.trim().toLowerCase(), password: result.password });
    setNewAccount({ name: "", email: "", companyName: "" });
    router.refresh();
  }

  function download() {
    const blob = new Blob(["﻿" + toCsv(visible, role)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `axon-arbor-${role === "consultant" ? "consultants" : "companies"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label={role === "consultant" ? "Filter consultants" : "Filter companies"} className="flex max-w-full overflow-x-auto border border-grey-200 bg-paper">
          {tabs.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={`flex shrink-0 items-center gap-2 px-4 py-2 text-sm whitespace-nowrap ${tab === t.value ? "bg-ink text-paper" : "text-grey-700 hover:bg-grey-100"}`}
            >
              {t.label}
              <span className={`text-xs ${tab === t.value ? "text-grey-300" : "text-grey-500"}`}>{counts[t.value]}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={role === "consultant" ? "Search name, email, expertise, city…" : "Search company, contact, email, industry…"}
          aria-label="Search accounts"
          className="min-w-56 flex-1 border border-grey-200 bg-paper px-4 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <AdminButton size="sm" onClick={download} disabled={visible.length === 0}>
          Download CSV
        </AdminButton>
        <AdminButton variant="dark" size="sm" onClick={() => {
            setDialogError(null);
            setAdding(true);
          }}
        >
          {role === "consultant" ? "Add consultant" : "Add company"}
        </AdminButton>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 border border-dashed border-grey-300 bg-paper px-6 py-16 text-center text-grey-600">
          {tab === "review"
            ? role === "consultant"
              ? "No profiles waiting. Submitted profiles and removal requests will appear here."
              : "No companies waiting. New registrations will appear here."
            : "Nothing here yet."}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((r) => {
            const open = openId === r.id;
            const ps = r.consultant?.profile_status;
            return (
              <li key={r.id} className="border border-grey-200 bg-paper">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.id)}
                  aria-expanded={open}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left hover:bg-grey-50"
                >
                  <span className="min-w-0 flex-1 basis-full sm:basis-0">
                    <span className="block truncate font-medium">{name(r)}</span>
                    <span className="block truncate text-sm text-grey-500">
                      {r.role === "consultant" ? (r.consultant?.expertise.slice(0, 2).join(", ") || "No expertise yet") : (r.company?.contact_name ?? "")} · {r.email}
                    </span>
                  </span>
                  <Badge strong={needsReview(r)}>{statusLabel(r)}</Badge>
                  <span className="text-sm text-grey-500">{formatDate(r.created_at)}</span>
                  <span aria-hidden="true" className="text-grey-400">
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open && (
                  <div className="border-t border-grey-200 px-5 py-6">
                    <Details row={r} />
                    <div className="mt-6 flex flex-wrap gap-2 border-t border-grey-100 pt-5">
                      {r.role === "company" && r.status === "pending" && (
                        <>
                          <AdminButton variant="primary" size="sm" onClick={() => ask({ kind: "company", row: r, decision: "approve" })}>
                            Approve company
                          </AdminButton>
                          <AdminButton size="sm" onClick={() => ask({ kind: "company", row: r, decision: "reject" })}>
                            Reject
                          </AdminButton>
                        </>
                      )}
                      {r.role === "company" && r.status === "rejected" && (
                        <AdminButton size="sm" onClick={() => ask({ kind: "company", row: r, decision: "approve" })}>
                          Approve after all
                        </AdminButton>
                      )}
                      {ps === "pending" && (
                        <>
                          <AdminButton variant="primary" size="sm" onClick={() => ask({ kind: "profile", row: r, decision: "approve" })}>
                            Approve profile
                          </AdminButton>
                          <AdminButton size="sm" onClick={() => ask({ kind: "profile", row: r, decision: "changes" })}>
                            Ask for changes
                          </AdminButton>
                        </>
                      )}
                      {ps === "removal_requested" && (
                        <>
                          <AdminButton variant="primary" size="sm" onClick={() => ask({ kind: "profile", row: r, decision: "remove" })}>
                            Remove profile
                          </AdminButton>
                          <AdminButton size="sm" onClick={() => ask({ kind: "profile", row: r, decision: "keep" })}>
                            Keep it live
                          </AdminButton>
                        </>
                      )}
                      {ps === "live" && (
                        <AdminButton size="sm" onClick={() => ask({ kind: "profile", row: r, decision: "remove" })}>
                          Take profile down
                        </AdminButton>
                      )}
                      {r.role === "company" && (
                        <AdminButton size="sm" onClick={() => ask({ kind: "manager", row: r }, r.company?.account_manager ?? "")}>
                          {r.company?.account_manager ? "Change account manager" : "Assign account manager"}
                        </AdminButton>
                      )}
                      <span className="flex-1" />
                      <AdminButton variant="ghost" size="sm" onClick={() => ask({ kind: "reset", row: r })}>
                        Reset password
                      </AdminButton>
                      {(r.status === "approved" || r.status === "suspended") && (
                        <AdminButton variant="ghost" size="sm" onClick={() => ask({ kind: "suspend", row: r, suspended: r.status !== "suspended" })}>
                          {r.status === "suspended" ? "Restore access" : "Pause account"}
                        </AdminButton>
                      )}
                      <AdminButton variant="ghost" size="sm" onClick={() => ask({ kind: "delete", row: r })}>
                        Delete account
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
        open={Boolean(pending)}
        title={dialog?.title ?? ""}
        confirmLabel={dialog?.confirm ?? "Confirm"}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
        busy={busy}
      >
        <p>{dialog?.body}</p>
        {pending && dialogError && (
          <p role="alert" className="mt-3 border-l-4 border-amber bg-grey-50 px-3 py-2 text-sm text-ink">
            {dialogError}
          </p>
        )}
        {dialog?.note && (
          <label className="mt-4 block">
            <span className="eyebrow text-grey-600">{dialog.note}</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-2 block w-full border border-grey-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </label>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={adding}
        title={role === "consultant" ? "Add a consultant" : "Add a company"}
        confirmLabel="Add"
        onConfirm={add}
        onCancel={() => setAdding(false)}
        busy={busy}
      >
        <p>
          {role === "consultant"
            ? "They’ll get an account with a draft profile to complete and submit."
            : "The company is approved straight away, as you’re adding it yourself."}{" "}
          You’ll get a temporary password to send them.
        </p>
        {dialogError && (
          <p role="alert" className="mt-3 border-l-4 border-amber bg-grey-50 px-3 py-2 text-sm text-ink">
            {dialogError}
          </p>
        )}
        <div className="mt-4 space-y-3">
          {role === "company" && (
            <label className="block">
              <span className="eyebrow text-grey-600">Company name</span>
              <input
                name="add_company_name"
                value={newAccount.companyName}
                onChange={(e) => setNewAccount({ ...newAccount, companyName: e.target.value })}
                className="mt-2 block w-full border border-grey-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </label>
          )}
          <label className="block">
            <span className="eyebrow text-grey-600">{role === "consultant" ? "Full name" : "Contact name"}</span>
            <input
              name="add_name"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              className="mt-2 block w-full border border-grey-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="eyebrow text-grey-600">Email</span>
            <input
              name="add_email"
              type="email"
              value={newAccount.email}
              onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
              className="mt-2 block w-full border border-grey-300 px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </label>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(tempPassword)}
        title="New temporary password"
        confirmLabel="Done"
        onConfirm={() => setTempPassword(null)}
        onCancel={() => setTempPassword(null)}
      >
        <p>
          Send this to <strong className="text-ink">{tempPassword?.email}</strong>. It is shown only once; they can change it from their account page.
        </p>
        <p className="mt-4 bg-grey-100 px-4 py-3 font-mono text-lg text-ink select-all">{tempPassword?.password}</p>
      </ConfirmDialog>

      <Toast message={toast?.message ?? null} tone={toast?.tone} />
    </div>
  );
}

function describe(p: Pending): { title: string; body: string; confirm: string; note?: string } {
  const who = name(p.row);
  switch (p.kind) {
    case "company":
      return p.decision === "approve"
        ? {
            title: `Approve ${who}?`,
            body: `They’ll get full access to their company account.${p.row.company?.email_confirmed_at ? "" : " They haven’t confirmed their email address, so check it’s genuine first."}`,
            confirm: "Approve",
            note: "Account manager (optional)",
          }
        : { title: `Reject ${who}?`, body: "They won’t be able to log in, and are told the registration wasn’t approved if they try.", confirm: "Reject", note: "Internal note (optional)" };
    case "profile":
      return {
        approve: { title: `Approve ${who}’s profile?`, body: "The profile goes live and can be matched to company requests.", confirm: "Approve" },
        changes: { title: `Ask ${who} for changes`, body: "The consultant sees your note on their account page.", confirm: "Send request", note: "What needs changing?" },
        remove: { title: `Remove ${who}’s profile?`, body: "Companies will no longer see it. The consultant keeps their account.", confirm: "Remove profile", note: "Internal note (optional)" },
        keep: { title: `Keep ${who}’s profile live?`, body: "This declines the removal request.", confirm: "Keep live", note: "Note to the consultant (optional)" },
      }[p.decision];
    case "suspend":
      return p.suspended
        ? { title: `Pause ${who}?`, body: "They’ll be signed out and can’t sign in until you restore access.", confirm: "Pause account" }
        : { title: `Restore ${who}?`, body: "They’ll be able to sign in again, with an approved account.", confirm: "Restore access" };
    case "manager":
      return { title: `Account manager for ${who}`, body: "The company sees this name on its account page. Leave it blank to clear it.", confirm: "Save", note: "Account manager’s name" };
    case "delete":
      return {
        title: `Delete ${who} permanently?`,
        body: "This erases the account, profile and any photos. It can’t be undone. Use this when someone asks for their data to be deleted.",
        confirm: "Delete permanently",
      };
    case "reset":
      return { title: `Reset ${who}’s password?`, body: "Their current password stops working. You’ll get a temporary one to send them.", confirm: "Reset password" };
  }
}

import type { Metadata } from "next";
import { ApprovalsBoard } from "@/components/admin/ApprovalsBoard";
import { ConsultantImport } from "@/components/admin/ConsultantImport";
import { getAccountsByRole } from "@/lib/accounts/admin";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Consultants" };

export default async function ConsultantsPage() {
  const session = await requireAdmin();
  const rows = await getAccountsByRole(session, "consultant").catch(() => null);
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-serif text-4xl tracking-tight">Consultants</h1>
      <p className="mt-2 text-grey-600">Consultants who have signed up. Approve submitted profiles, ask for changes, and handle removal requests.</p>
      <ConsultantImport />
      {rows ? (
        <ApprovalsBoard rows={rows} role="consultant" />
      ) : (
        <p className="mt-8 border-l-4 border-amber bg-paper px-5 py-4 text-grey-700">Couldn’t load the accounts. Please refresh the page.</p>
      )}
    </div>
  );
}

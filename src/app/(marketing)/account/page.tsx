import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { signOutAccount } from "@/app/account-actions";
import { ChangePasswordForm, CompanyProfileForm, ConsultantProfileForm, RemovalButton } from "@/components/accounts/AccountForms";
import { Container } from "@/components/layout/Container";
import { getCompanyProfile, getConsultantProfile, requireAccount, type Account, type ProfileStatus } from "@/lib/accounts/data";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<Container className="py-24 text-grey-500">Loading your account…</Container>}>
      <AccountPage />
    </Suspense>
  );
}

const PROFILE_STATUS: Record<ProfileStatus, { label: string; text: string }> = {
  draft: { label: "Not submitted", text: "Complete your profile below and submit it. Our team reviews every profile before companies can see it." },
  pending: { label: "Waiting for approval", text: "Thanks — Axon Arbor is reviewing your profile. You can still make changes; they’ll be included in the review." },
  live: { label: "Live", text: "Your profile is approved and can be matched to company requests. Any change you save goes back for a quick review." },
  changes_requested: { label: "Changes requested", text: "Axon Arbor has asked for a few changes. Update your profile below and submit it again." },
  removal_requested: { label: "Removal requested", text: "You’ve asked us to remove your profile. Axon Arbor will confirm shortly." },
  removed: { label: "Removed", text: "Your profile has been removed and companies can’t see it. You can complete and submit it again at any time." },
};

function StatusPanel({ label, text, note, tone }: { label: string; text: string; note?: string | null; tone: "amber" | "ink" }) {
  return (
    <div className={`border-l-4 bg-grey-50 px-6 py-5 ${tone === "amber" ? "border-amber" : "border-ink"}`}>
      <p className="eyebrow text-grey-600">Status</p>
      <p className="mt-1 font-serif text-2xl">{label}</p>
      <p className="mt-2 max-w-2xl text-grey-700">{text}</p>
      {note && (
        <p className="mt-3 max-w-2xl text-sm text-grey-700">
          <span className="font-semibold text-ink">Note from Axon Arbor:</span> {note}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-grey-200 py-12">
      <h2 className="mb-8 font-serif text-3xl tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Header({ account, name }: { account: Account; name: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 pb-10">
      <div>
        <p className="eyebrow text-grey-600">{account.role === "consultant" ? "Consultant account" : "Company account"}</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Hello, {name}.</h1>
        <p className="mt-3 text-grey-600">Signed in as {account.email}</p>
      </div>
      <form action={signOutAccount}>
        <button type="submit" className="font-label text-xs font-semibold tracking-[0.16em] text-grey-700 uppercase hover:text-ink">
          Sign out
        </button>
      </form>
    </div>
  );
}

async function AccountPage() {
  const account = await requireAccount();

  if (account.role === "consultant") {
    const profile = await getConsultantProfile(account.id);
    if (!profile) return <Missing />;
    const status = PROFILE_STATUS[profile.profile_status];
    return (
      <Container className="py-16 sm:py-20">
        <Header account={account} name={profile.full_name.split(" ")[0] || "there"} />
        <StatusPanel
          {...status}
          note={profile.profile_status === "changes_requested" ? profile.review_note : null}
          tone={profile.profile_status === "live" ? "ink" : "amber"}
        />
        <Section title="Your profile">
          <ConsultantProfileForm profile={profile} />
        </Section>
        {(profile.profile_status === "live" || profile.profile_status === "pending") && (
          <Section title="Remove your profile">
            <p className="mb-6 max-w-2xl text-grey-600">Companies will no longer be able to find you once Axon Arbor confirms the removal.</p>
            <RemovalButton />
          </Section>
        )}
        <Section title="Password">
          <ChangePasswordForm />
        </Section>
      </Container>
    );
  }

  const company = await getCompanyProfile(account.id);
  if (!company) return <Missing />;

  return (
    <Container className="py-16 sm:py-20">
      <Header account={account} name={company.contact_name.split(" ")[0] || "there"} />
      <StatusPanel
        label="Approved"
        text={`Your company is approved.${company.account_manager ? ` Your account manager is ${company.account_manager}.` : ""} Searching for consultants will open here soon.`}
        tone="ink"
      />
      <Section title={company.company_name}>
        <CompanyProfileForm company={company} />
      </Section>
      <Section title="Password">
        <ChangePasswordForm />
      </Section>
    </Container>
  );
}

function Missing() {
  return (
    <Container className="py-24">
      <h1 className="font-serif text-4xl">We couldn’t load your account.</h1>
      <p className="mt-4 text-grey-600">Please sign out and in again, or contact Axon Arbor.</p>
      <form action={signOutAccount} className="mt-8">
        <button type="submit" className="underline decoration-amber decoration-2 underline-offset-4">
          Sign out
        </button>
      </form>
    </Container>
  );
}

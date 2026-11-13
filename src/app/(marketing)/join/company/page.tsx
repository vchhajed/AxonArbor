import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CompanySignUpForm } from "@/components/accounts/AuthForms";
import { GuestOnly } from "@/components/accounts/GuestOnly";
import { BenefitsBand, COMPANY_BENEFITS, COMPANY_STEPS, FormWithSteps } from "@/components/accounts/Pitch";
import { PageHeader } from "@/components/sections/PageHeader";

export const metadata: Metadata = {
  title: "Register your company",
  description: "Register your organisation with Axon Arbor and get shortlists of reviewed consultants matched to your needs.",
  alternates: { canonical: "/join/company" },
};

const header = (
  <PageHeader
    eyebrow="For companies"
    heading="The right expert, without the search."
    lede="Register your organisation to reach Axon Arbor’s reviewed network of consultants, matched to what your people need."
  />
);

export default function Page() {
  return (
    <Suspense fallback={header}>
      <GuestOnly>
        {header}
        <BenefitsBand eyebrow="Why Axon Arbor" heading="Less searching. Better matches." points={COMPANY_BENEFITS} />
        <FormWithSteps title="Register your organisation" steps={COMPANY_STEPS}>
          <CompanySignUpForm />
          <p className="mt-10 text-base text-grey-600">
            Already registered?{" "}
            <Link href="/sign-in" className="text-ink underline decoration-amber decoration-2 underline-offset-4">
              Sign in
            </Link>
            .
          </p>
        </FormWithSteps>
      </GuestOnly>
    </Suspense>
  );
}

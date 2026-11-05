import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmEmailForm } from "@/components/accounts/AuthForms";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/sections/PageHeader";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<{ token?: string }> };

async function Form({ searchParams }: Props) {
  const { token } = await searchParams;
  return <ConfirmEmailForm token={token ?? ""} />;
}

export default function Page({ searchParams }: Props) {
  return (
    <>
      <PageHeader eyebrow="For companies" heading="Confirm your email." lede="This helps Axon Arbor check your registration." />
      <Container className="py-16 sm:py-20">
        <Suspense>
          <Form searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

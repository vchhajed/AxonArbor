import type { Metadata } from "next";
import { Suspense } from "react";
import { SetPasswordForm } from "@/components/accounts/AuthForms";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/sections/PageHeader";

export const metadata: Metadata = {
  title: "Choose a password",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

async function Form({ searchParams }: Props) {
  const { token } = await searchParams;
  return <SetPasswordForm token={token ?? ""} />;
}

export default function Page({ searchParams }: Props) {
  return (
    <>
      <PageHeader eyebrow="Your account" heading="Choose a password." lede="Set your password to finish setting up your Axon Arbor account." />
      <Container className="py-16 sm:py-20">
        <Suspense>
          <Form searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

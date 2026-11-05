import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/accounts/AuthForms";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/sections/PageHeader";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Your account" heading="Reset your password." lede="Enter your email address and we’ll send you a link to choose a new password." />
      <Container className="py-16 sm:py-20">
        <ForgotPasswordForm />
      </Container>
    </>
  );
}

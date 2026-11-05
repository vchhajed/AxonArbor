import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/sections/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { emailsEnabled } from "@/lib/email/send";

export const metadata: Metadata = {
  title: "Registration received",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="For companies"
        heading="Thank you. We’ve received your registration."
        lede={`Axon Arbor checks every organisation before granting access. You’ll be able to sign in once yours is approved.${
          emailsEnabled() ? " Please check your inbox and confirm your email address." : ""
        }`}
      />
      <Container className="py-16 sm:py-20">
        <ButtonLink href="/">Back to home</ButtonLink>
      </Container>
    </>
  );
}

"use client";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export default function AccountError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Container className="py-24">
      <h1 className="font-serif text-4xl tracking-tight">We couldn’t load your account just now.</h1>
      <p className="mt-4 max-w-xl text-grey-600">This is usually temporary. Please try again in a moment. If it keeps happening, email info@axonarbor.in.</p>
      <Button type="button" className="mt-8" onClick={() => retry()}>
        Try again
      </Button>
    </Container>
  );
}

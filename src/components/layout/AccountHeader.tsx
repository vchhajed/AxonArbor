import { Suspense } from "react";
import { getCurrentAccount } from "@/lib/accounts/data";
import { Header, type HeaderProps } from "./Header";

async function SignedInHeader({ site }: Pick<HeaderProps, "site">) {
  const account = await getCurrentAccount();
  return <Header site={site} signedIn={account !== null} />;
}

/**
 * The public header with the visitor's sign-in state. The signed-out header is
 * prerendered; the session is read per request and streamed in. The inline
 * editor renders the plain Header instead, so it never reads a session.
 */
export function AccountHeader({ site }: Pick<HeaderProps, "site">) {
  return (
    <Suspense fallback={<Header site={site} />}>
      <SignedInHeader site={site} />
    </Suspense>
  );
}

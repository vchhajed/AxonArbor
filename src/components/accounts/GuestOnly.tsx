import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentAccount } from "@/lib/accounts/data";

/**
 * For the sign-in and sign-up pages: someone already signed in goes to their
 * account instead of seeing the forms. Wrap it in <Suspense>, as it reads the
 * session at request time. The check is the same one /account uses, so an
 * expired or paused session can never bounce between the two.
 */
export async function GuestOnly({ children }: { children: ReactNode }) {
  if (await getCurrentAccount()) redirect("/account");
  return children;
}

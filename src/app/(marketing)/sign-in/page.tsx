import type { Metadata } from "next";
import { Suspense } from "react";
import { GuestOnly } from "@/components/accounts/GuestOnly";
import { PageHeader } from "@/components/sections/PageHeader";
import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { SignInView } from "@/views/SignInView";

export async function generateMetadata(): Promise<Metadata> {
  const [page, site] = await Promise.all([getContent("sign-in"), getContent("site")]);
  return pageMetadata(page.meta, site.name);
}

export default async function Page() {
  const [signIn, site] = await Promise.all([getContent("sign-in"), getContent("site")]);
  return (
    <Suspense fallback={<PageHeader {...signIn.header} />}>
      <GuestOnly>
        <SignInView signIn={signIn} site={site} />
      </GuestOnly>
    </Suspense>
  );
}

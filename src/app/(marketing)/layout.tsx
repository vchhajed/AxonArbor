import { AccountHeader } from "@/components/layout/AccountHeader";
import { getContent } from "@/lib/content";
import { SiteChrome } from "@/views/SiteChrome";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const site = await getContent("site");
  return (
    <SiteChrome site={site} header={<AccountHeader site={site} />}>
      {children}
    </SiteChrome>
  );
}

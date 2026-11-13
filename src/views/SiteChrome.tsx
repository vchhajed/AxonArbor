import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { SiteContent } from "@/content/types";

/**
 * Header, main landmark and footer around every public page. The public site
 * passes a header that knows who is signed in; the inline editor uses the default.
 */
export function SiteChrome({ site, header, children }: { site: SiteContent; header?: ReactNode; children: ReactNode }) {
  return (
    <>
      {header ?? <Header site={site} />}
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer site={site} />
    </>
  );
}

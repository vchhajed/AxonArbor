import Link from "next/link";
import type { SiteContent } from "@/content/types";
import { Container } from "./Container";
import { Logo } from "./Logo";

export function Footer({ site }: { site: SiteContent }) {
  const { footer, contact } = site;
  return (
    <footer className="bg-ink text-paper">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <Logo logo={site.logo} name={site.name} tone="dark" />
          <p className="eyebrow mt-6 text-grey-300">{site.tagline}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-grey-300">{footer.blurb}</p>
        </div>

        <nav aria-label="Footer" className="lg:col-span-3">
          <h2 className="eyebrow text-grey-400">{footer.exploreHeading}</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {[...site.nav, ...(site.headerCta?.label ? [site.headerCta] : []), site.signIn].map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link href={link.href} className="text-grey-200 transition-colors hover:text-amber">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <h2 className="eyebrow text-grey-400">{footer.contactHeading}</h2>
          <address className="mt-5 space-y-4 text-sm leading-relaxed text-grey-200 not-italic">
            <p>
              {contact.address.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>
            {contact.email && (
              <p>
                <a
                  href={`mailto:${contact.email}`}
                  className="underline decoration-grey-600 underline-offset-4 transition-colors hover:text-amber hover:decoration-amber"
                >
                  {contact.email}
                </a>
              </p>
            )}
            {contact.phone && (
              <p>
                <a href={contact.phoneHref} className="transition-colors hover:text-amber">
                  {contact.phone}
                </a>
              </p>
            )}
          </address>
        </div>
      </Container>
      <div className="border-t border-grey-800">
        <Container className="flex flex-col gap-2 py-6 text-xs text-grey-400 sm:flex-row sm:justify-between">
          <p>{footer.copyright}</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            {footer.legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-amber">
                {link.label}
              </Link>
            ))}
            <span>{footer.location}</span>
          </nav>
        </Container>
      </div>
    </footer>
  );
}

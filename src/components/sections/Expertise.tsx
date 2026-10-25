import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { SectionIntro } from "@/components/ui/SectionIntro";
import type { HomeContent } from "@/content/types";

const badgeTone: Record<string, string> = {
  professional: "bg-amber text-ink",
  expert: "bg-ink text-paper",
};

function Silhouette() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className="size-14 text-grey-300">
      <rect width="64" height="64" fill="currentColor" opacity="0.35" />
      <circle cx="32" cy="25" r="11" fill="currentColor" />
      <path d="M12 64c2-14 10-21 20-21s18 7 20 21z" fill="currentColor" />
    </svg>
  );
}

/** Fold 4b: anonymised sample expert cards, the way the platform shows matches, plus an optional logo strip. */
export function Expertise({ eyebrow, heading, lede, note, cards, logosHeading, showLogos, logos }: HomeContent["expertise"]) {
  const shownLogos = showLogos ? logos.filter((l) => l.src) : [];
  return (
    <section aria-labelledby="expertise-heading" className="py-24 sm:py-32">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionIntro id="expertise-heading" eyebrow={eyebrow} heading={heading} lede={lede} />
          {note && <p className="eyebrow shrink-0 text-grey-500">{note}</p>}
        </Reveal>
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <Reveal as="li" key={i} delay={i * 0.08} className="flex flex-col border border-grey-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <Silhouette />
                {card.badge && (
                  <span
                    className={`font-label text-[0.65rem] font-semibold tracking-[0.16em] uppercase ${
                      badgeTone[card.badge.trim().toLowerCase().replace(/[^a-z]/g, "")] ?? "border border-ink"
                    } px-2.5 py-1`}
                  >
                    {card.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-6 font-serif text-2xl tracking-tight">{card.name}</h3>
              <p className="mt-1 text-grey-700">{card.specialty}</p>
              <dl className="mt-6 space-y-3 border-t border-grey-200 pt-5 text-sm">
                <div>
                  <dt className="eyebrow text-grey-500">Experience</dt>
                  <dd className="mt-1">{card.experience}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-grey-500">Certifications</dt>
                  <dd className="mt-1">{card.certifications}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-grey-500">Worked with</dt>
                  <dd className="mt-1">{card.workedWith}</dd>
                </div>
              </dl>
            </Reveal>
          ))}
        </ul>

        {shownLogos.length > 0 && (
          <div className="mt-16 border-t border-grey-200 pt-10">
            <p className="eyebrow text-grey-600">{logosHeading}</p>
            <ul className="mt-8 flex flex-wrap items-center gap-x-12 gap-y-8">
              {shownLogos.map((logo, i) => (
                <li key={i}>
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.width || 240}
                    height={logo.height || 96}
                    className="h-10 w-auto object-contain grayscale"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}

import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { CTABand } from "@/components/sections/CTABand";
import { PageHeader } from "@/components/sections/PageHeader";
import { PersonCard } from "@/components/sections/PersonCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionIntro } from "@/components/ui/SectionIntro";
import type { AboutContent } from "@/content/types";

/**
 * The facilitator network as a slow, endless strip of small portraits. Names
 * and roles stay out of the page on purpose: Richa wants the network shown
 * anonymously. Short lists are repeated so the strip always fills the width.
 */
function FacilitatorStrip({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  const filled: string[] = [];
  while (filled.length < 14) filled.push(...photos);
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="ticker-row flex shrink-0 items-center gap-4 pr-4">
      {filled.map((src, i) => (
        <li key={i} className="relative h-32 w-26 shrink-0 overflow-hidden bg-grey-100 sm:h-36 sm:w-29">
          <Image src={src} alt="" fill sizes="116px" className="object-cover grayscale" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="mt-14 overflow-hidden" role="img" aria-label="Portraits of facilitators in the Axon Arbor network">
      <div className="photo-strip-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

export function AboutView({ about }: { about: AboutContent }) {
  const { header, founder, advisors, facilitators, partners, cta } = about;
  return (
    <>
      <PageHeader {...header} />

      <section aria-labelledby="founder-heading" className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <figure>
              <div className="relative aspect-[4/5] overflow-hidden bg-grey-100">
                {founder.image.src && (
                  <Image
                    src={founder.image.src}
                    alt={founder.image.alt}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    loading="eager"
                    fetchPriority="high"
                    className="object-cover grayscale"
                  />
                )}
              </div>
              <figcaption className="mt-5 flex items-baseline justify-between gap-4 border-b border-grey-200 pb-5">
                <span className="font-serif text-xl">{founder.name}</span>
                <span className="eyebrow text-grey-600">{founder.role}</span>
              </figcaption>
            </figure>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7 lg:pt-8">
            <Eyebrow>{founder.eyebrow}</Eyebrow>
            <h2
              id="founder-heading"
              className="mt-5 font-serif text-4xl leading-[1.08] tracking-tight text-balance sm:text-5xl"
            >
              {founder.heading}
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-grey-700">
              {founder.paragraphs.map((p, i) => (
                <p key={i} className={i === 0 ? "font-serif text-2xl leading-snug text-ink" : undefined}>
                  {p}
                </p>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="advisors-heading" className="border-t border-grey-200 bg-grey-50 py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionIntro id="advisors-heading" eyebrow={advisors.eyebrow} heading={advisors.heading} />
          </Reveal>
          <ul className="mt-14 grid gap-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {advisors.people.map((person, i) => (
              <Reveal as="li" key={i} delay={i * 0.08}>
                <PersonCard person={person} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="facilitators-heading" className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionIntro id="facilitators-heading" eyebrow={facilitators.eyebrow} heading={facilitators.heading} />
          </Reveal>
        </Container>
        <FacilitatorStrip photos={facilitators.people.map((p) => p.image?.src).filter((src): src is string => !!src)} />
      </section>

      <section id="partners" aria-labelledby="partners-heading" className="scroll-mt-20 border-t border-grey-200 py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionIntro id="partners-heading" eyebrow={partners.eyebrow} heading={partners.heading} />
          </Reveal>
          <div className="mt-14 grid gap-px border border-grey-200 bg-grey-200 lg:grid-cols-2">
            {partners.items.map((partner, i) => (
              <Reveal key={i} delay={i * 0.1} className="flex flex-col bg-paper p-8 sm:p-12">
                <article className="flex h-full flex-col">
                  {partner.logo.src && (
                    <div className="flex h-20 items-center">
                      <Image
                        src={partner.logo.src}
                        alt={partner.logo.alt}
                        width={partner.logo.width || 400}
                        height={partner.logo.height || 160}
                        sizes="200px"
                        className="h-full max-h-20 w-auto object-contain grayscale"
                      />
                    </div>
                  )}
                  <p className="eyebrow mt-10 text-grey-600">{partner.kind}</p>
                  <h3 className="mt-3 font-serif text-3xl tracking-tight">{partner.name}</h3>
                  <div className="mt-5 space-y-4 leading-relaxed text-grey-700">
                    {partner.paragraphs.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                  {partner.list && partner.list.length > 0 && (
                    <ul className="mt-5 space-y-2.5">
                      {partner.list.map((entry, j) => (
                        <li key={j} className="flex gap-3 text-grey-800">
                          <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 bg-amber" />
                          {entry}
                        </li>
                      ))}
                    </ul>
                  )}
                  {partner.stats && partner.stats.length > 0 && (
                    <dl className="mt-auto grid grid-cols-2 gap-6 border-t border-grey-200 pt-8">
                      {partner.stats.map((stat, j) => (
                        <div key={j} className="flex flex-col-reverse">
                          <dt className="eyebrow mt-2 text-grey-600">{stat.label}</dt>
                          <dd className="font-label text-4xl font-bold tracking-tight">{stat.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CTABand {...cta} />
    </>
  );
}

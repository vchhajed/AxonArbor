import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { BeyondTraining } from "@/components/sections/BeyondTraining";
import { CapabilityStack } from "@/components/sections/CapabilityStack";
import { CTABand } from "@/components/sections/CTABand";
import { PageHeader } from "@/components/sections/PageHeader";
import { SectionIntro } from "@/components/ui/SectionIntro";
import type { ProgrammesContent } from "@/content/types";

export function ProgrammesView({ programmes }: { programmes: ProgrammesContent }) {
  const { header, intro, areas, programmes: signature, capabilityStack, beyondTraining, cta } = programmes;
  return (
    <>
      <PageHeader {...header} />

      <section aria-labelledby="areas-heading" className="py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-12">
          <Reveal className="space-y-6 lg:col-span-5">
            {intro.map((p, i) => (
              <p key={i} className="font-serif text-2xl leading-snug text-pretty">
                {p}
              </p>
            ))}
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7">
            <p aria-hidden="true" className="eyebrow text-grey-600">
              {areas.eyebrow}
            </p>
            <h2 id="areas-heading" className="sr-only">
              {areas.heading}
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {areas.items.map((item, i) => (
                <li
                  key={i}
                  className="border border-grey-300 px-4 py-2 text-sm text-grey-800 transition-colors hover:border-ink"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 leading-relaxed text-grey-600">{areas.note}</p>
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="signature-heading" className="border-t border-grey-200 bg-grey-50 py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionIntro id="signature-heading" eyebrow={signature.eyebrow} heading={signature.heading} />
          </Reveal>
          <ol className="mt-14 border-t border-ink">
            {signature.items.map((item, i) => (
              <li
                key={i}
                id={item.id || undefined}
                className="grid scroll-mt-24 gap-6 border-b border-grey-200 py-12 lg:grid-cols-12 lg:gap-10"
              >
                <Reveal className="flex gap-5 lg:col-span-5">
                  <span className="pt-2 font-label text-xs font-semibold tracking-[0.18em] text-grey-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{item.title}</h3>
                </Reveal>
                <Reveal delay={0.08} className="lg:col-span-6 lg:col-start-7">
                  <p className="text-lg leading-relaxed text-grey-700">{item.body}</p>
                  {item.list && item.list.length > 0 && (
                    <div className="mt-6">
                      <p className="eyebrow text-grey-500">{item.listLabel}</p>
                      <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                        {item.list.map((entry, j) => (
                          <li key={j} className="flex gap-3 text-grey-800">
                            <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 bg-amber" />
                            {entry}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <CapabilityStack {...capabilityStack} />
      <BeyondTraining {...beyondTraining} />

      <CTABand {...cta} />
    </>
  );
}

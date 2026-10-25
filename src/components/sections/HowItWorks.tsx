import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { SectionIntro } from "@/components/ui/SectionIntro";
import type { HomeContent } from "@/content/types";

/** Fold 4a: five steps for organisations, horizontal on desktop and stacked on phones. */
export function HowItWorks({ eyebrow, heading, lede, steps, note }: HomeContent["howItWorks"]) {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-20 bg-grey-50 py-24 sm:py-32">
      <Container>
        <Reveal>
          <SectionIntro id="how-heading" eyebrow={eyebrow} heading={heading} lede={lede} />
        </Reveal>
        <div className="mt-14 border border-grey-200 bg-paper px-6 py-10 sm:mt-16 sm:px-10 lg:py-12">
          <ol className="relative grid gap-0 lg:grid-cols-5 lg:gap-8">
            {/* One rail through every step: down the side on phones, across on desktop. */}
            <span
              aria-hidden="true"
              className="absolute top-4 bottom-4 left-[15px] w-px bg-grey-200 lg:top-[15px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto"
            />
            {steps.map((step, i) => (
              <Reveal
                as="li"
                key={i}
                delay={i * 0.08}
                className="relative flex gap-5 pb-10 last:pb-0 lg:flex-col lg:gap-0 lg:pb-0"
              >
                <span
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center font-label text-xs font-semibold tabular-nums ${
                    i === 0 ? "bg-amber text-ink" : "border border-grey-300 bg-paper text-grey-700"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="lg:mt-6">
                  <h3 className="font-serif text-xl leading-snug tracking-tight lg:text-[1.3rem]">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-grey-600">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
        {note && <p className="mt-8 max-w-2xl text-sm text-grey-600">{note}</p>}
      </Container>
    </section>
  );
}

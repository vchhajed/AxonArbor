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
        <ol className="mt-14 grid gap-0 sm:mt-16 lg:grid-cols-5 lg:gap-6">
          {steps.map((step, i) => (
            <Reveal
              as="li"
              key={i}
              delay={i * 0.08}
              className="relative flex gap-5 border-l border-grey-300 pb-10 pl-6 last:pb-0 lg:flex-col lg:gap-0 lg:border-t lg:border-l-0 lg:pt-8 lg:pb-0 lg:pl-0"
            >
              <span
                aria-hidden="true"
                className="absolute top-0 -left-[5px] size-2.5 bg-amber lg:-top-[5px] lg:left-0"
              />
              <span className="font-serif text-4xl text-grey-400 tabular-nums lg:text-5xl">{i + 1}</span>
              <div className="lg:mt-5">
                <h3 className="font-serif text-xl leading-snug tracking-tight lg:text-[1.35rem]">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-grey-600">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        {note && <p className="mt-12 max-w-2xl text-sm text-grey-600">{note}</p>}
      </Container>
    </section>
  );
}

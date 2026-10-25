import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { SectionIntro } from "@/components/ui/SectionIntro";
import type { HomeContent } from "@/content/types";
import { Hideable } from "./Hideable";

/** Fold 6: quotes from clients. Only quotes switched on are shown; no made-up testimonials. */
export function Testimonials({ eyebrow, heading, items }: HomeContent["testimonials"]) {
  return (
    <section aria-labelledby="testimonials-heading" className="border-t border-grey-200 py-24 sm:py-32">
      <Container>
        <Reveal>
          <SectionIntro id="testimonials-heading" eyebrow={eyebrow} heading={heading} />
        </Reveal>
        <ul className="mt-14 grid gap-10 lg:grid-cols-3">
          {items.map((t, i) => (
            <Hideable key={i} as="li" show={t.show} className="border-t-2 border-amber pt-8">
              <figure>
                <blockquote className="font-serif text-2xl leading-snug text-pretty">“{t.quote}”</blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="block font-medium">{t.name}</span>
                  <span className="block text-grey-600">{t.role}</span>
                </figcaption>
              </figure>
            </Hideable>
          ))}
        </ul>
      </Container>
    </section>
  );
}

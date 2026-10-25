import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { SectionIntro } from "@/components/ui/SectionIntro";
import type { HomeContent } from "@/content/types";
import { Ticker } from "./Ticker";

type Props = HomeContent["curated"] & { areas: { heading: string; items: string[] } };

/** Fold 3: "Not crowded but curated" with six benefits, confirmed numbers and the topic ticker. */
export function Curated({ eyebrow, heading, lede, tiles, stats, programmesLink, areas }: Props) {
  const shown = stats.filter((s) => s.show);
  return (
    <section aria-labelledby="curated-heading" className="pt-24 sm:pt-32">
      <Container>
        <Reveal>
          <SectionIntro id="curated-heading" eyebrow={eyebrow} heading={heading} lede={lede} />
        </Reveal>
        <ol className="mt-14 grid gap-px border-y border-ink bg-grey-200 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile, i) => (
            <Reveal as="li" key={i} delay={(i % 3) * 0.08} className="bg-paper py-9 sm:p-9">
              <p className="flex items-center gap-3 font-label text-xs font-semibold tracking-[0.18em] text-grey-600">
                <span aria-hidden="true" className="size-2 bg-amber" />
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-5 font-serif text-2xl tracking-tight">{tile.title}</h3>
              <p className="mt-3 leading-relaxed text-grey-600">{tile.body}</p>
            </Reveal>
          ))}
        </ol>

        {shown.length > 0 && (
          <dl
            className={`mt-16 grid gap-10 sm:grid-cols-2 ${shown.length > 2 ? "lg:grid-cols-4" : ""} ${
              shown.length === 1 ? "sm:grid-cols-1" : ""
            }`}
          >
            {shown.map((stat, i) => (
              <Reveal key={i} delay={i * 0.08} className="flex items-baseline gap-5 border-t border-grey-200 pt-6">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-serif text-6xl tracking-tight sm:text-7xl">{stat.value}</dd>
                <dd className="max-w-xs text-grey-600">{stat.label}</dd>
              </Reveal>
            ))}
          </dl>
        )}
      </Container>

      <div className="mt-20 sm:mt-24">
        <Ticker label={areas.heading} items={areas.items} />
        {programmesLink.label && (
          <Container className="flex justify-end py-5">
            <Link
              href={programmesLink.href}
              className="font-label text-xs font-semibold tracking-[0.16em] uppercase underline decoration-amber decoration-2 underline-offset-8"
            >
              {programmesLink.label} →
            </Link>
          </Container>
        )}
      </div>
    </section>
  );
}

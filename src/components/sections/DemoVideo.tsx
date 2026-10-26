import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { SectionIntro } from "@/components/ui/SectionIntro";
import type { DemoVideo as DemoMedia, HomeContent } from "@/content/types";
import { DemoPlayer as Player } from "./DemoPlayer";

/** The product demo, 16:9 on larger screens and 9:16 on phones. Plays muted once on screen. */
export function DemoVideo({ eyebrow, heading, lede, media, cta }: HomeContent["demo"]) {
  const m: DemoMedia = media;
  const mobile = m.videoMobile || m.video;
  return (
    <section aria-labelledby="demo-heading" className="bg-ink py-24 text-paper sm:py-32">
      <Container>
        <Reveal>
          <SectionIntro id="demo-heading" eyebrow={eyebrow} heading={heading} lede={lede} tone="dark" />
        </Reveal>
        <div className="mt-12 sm:mt-14">
          {m.video && (
            <Player
              src={m.video}
              poster={m.poster}
              captions={m.captions}
              className="hidden aspect-video w-full sm:block"
            />
          )}
          {mobile && (
            <Player
              src={mobile}
              poster={m.posterMobile || m.poster}
              captions={m.captions}
              className="mx-auto aspect-[9/16] w-full max-w-sm sm:hidden"
            />
          )}
        </div>
        {cta.label && (
          <div className="mt-10">
            <ButtonLink href={cta.href}>{cta.label}</ButtonLink>
          </div>
        )}
      </Container>
    </section>
  );
}

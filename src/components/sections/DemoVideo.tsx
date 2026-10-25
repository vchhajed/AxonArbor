import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { SectionIntro } from "@/components/ui/SectionIntro";
import type { DemoVideo as DemoMedia, HomeContent } from "@/content/types";

function Player({ src, poster, captions, className }: { src: string; poster: string; captions: string; className: string }) {
  return (
    <video controls playsInline preload="none" poster={poster || undefined} className={className}>
      <source src={src} type="video/mp4" />
      {captions && <track kind="captions" src={captions} srcLang="en-GB" label="English" default />}
    </video>
  );
}

/** Fold 5: the product demo, 16:9 on larger screens and 9:16 on phones. Loads only when played. */
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
              className="hidden aspect-video w-full bg-grey-900 sm:block"
            />
          )}
          {mobile && (
            <Player
              src={mobile}
              poster={m.posterMobile || m.poster}
              captions={m.captions}
              className="mx-auto aspect-[9/16] w-full max-w-sm bg-grey-900 sm:hidden"
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

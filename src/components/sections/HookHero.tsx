"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Container } from "@/components/layout/Container";
import type { HeroDoor, HookContent, VideoBackdrop } from "@/content/types";

const PORTRAIT = "(max-aspect-ratio: 1/1)";
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeTo(query: string) {
  return (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  };
}
const subscribePortrait = subscribeTo(PORTRAIT);
const subscribeReduced = subscribeTo(REDUCED);
const noop = () => () => {};

/** Media-query state; false on the server and in the first client render. */
function useMedia(query: string, subscribe: (cb: () => void) => () => void) {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

function pick(b: VideoBackdrop, portrait: boolean) {
  return {
    video: portrait ? b.videoMobile || b.video : b.video || b.videoMobile,
    poster: portrait ? b.posterMobile || b.poster : b.poster || b.posterMobile,
  };
}

/**
 * One backdrop layer. The server renders only the still (with a portrait
 * crop for phones); the video starts after hydration, once we know which cut
 * fits the screen, so phones never download the landscape file.
 */
function Layer({ backdrop, visible, play }: { backdrop: VideoBackdrop; visible: boolean; play: boolean }) {
  const portrait = useMedia(PORTRAIT, subscribePortrait);
  const { video, poster } = pick(backdrop, portrait);
  const media = "size-full object-cover grayscale";
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {play && video ? (
        <video key={video} src={video} poster={poster} autoPlay muted loop playsInline className={media} />
      ) : (
        <picture>
          {backdrop.posterMobile && <source media={PORTRAIT} srcSet={backdrop.posterMobile} />}
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative backdrop still, swapped for video */}
          {poster && <img src={poster} alt="" className={media} fetchPriority="high" />}
        </picture>
      )}
    </div>
  );
}

function Door({
  door,
  primary,
  onActive,
}: {
  door: HeroDoor;
  primary: boolean;
  onActive: (active: boolean) => void;
}) {
  return (
    <Link
      href={door.href}
      onMouseEnter={() => onActive(true)}
      onMouseLeave={() => onActive(false)}
      onFocus={() => onActive(true)}
      onBlur={() => onActive(false)}
      className={`group flex flex-col gap-3 p-6 transition-colors duration-200 sm:p-7 ${
        primary
          ? "bg-amber text-ink hover:bg-paper"
          : "border border-paper/50 bg-ink/40 text-paper backdrop-blur-sm hover:bg-paper hover:text-ink"
      }`}
    >
      <span className="eyebrow">{door.eyebrow}</span>
      <span className="flex items-center justify-between gap-4 font-serif text-2xl leading-tight sm:text-[1.7rem]">
        {door.label}
        <svg
          aria-hidden="true"
          viewBox="0 0 16 10"
          className="h-3 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M0 5h14M10 1l4 4-4 4" />
        </svg>
      </span>
    </Link>
  );
}

/**
 * Fold 1: a darkened, looping video behind the headline and two doors,
 * "I want to hire" and "I want to work". Hovering a door can swap the
 * backdrop to its own video (Upwork-style); visitors who prefer reduced
 * motion see the still only.
 */
export function HookHero({ eyebrow, heading, lede, backdrop, hire, work, waitlist, trust }: HookContent) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const reduced = useMedia(REDUCED, subscribeReduced);
  const play = mounted && !reduced;
  const [active, setActive] = useState<"hire" | "work" | null>(null);
  // A door's video loads the first time it's chosen, not with the page.
  const [touched, setTouched] = useState<{ hire: boolean; work: boolean }>({ hire: false, work: false });

  const doorFor = (key: "hire" | "work") => (on: boolean) => {
    setActive(on ? key : null);
    if (on && !touched[key]) setTouched((t) => ({ ...t, [key]: true }));
  };
  const hasOwn = (door: HeroDoor) => Boolean(door.backdrop.video || door.backdrop.videoMobile);

  return (
    <section aria-labelledby="hook-heading" className="relative isolate overflow-hidden bg-ink text-paper">
      <div className="absolute inset-0 -z-10">
        <Layer backdrop={backdrop} visible play={play} />
        {(["hire", "work"] as const).map((key) => {
          const door = key === "hire" ? hire : work;
          return hasOwn(door) && touched[key] ? (
            <Layer key={key} backdrop={door.backdrop} visible={active === key} play={play} />
          ) : null;
        })}
        <div className="absolute inset-0 bg-ink/55" />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-ink via-ink/70 to-transparent" />
      </div>

      <Container className="flex min-h-[calc(100svh-4rem)] flex-col justify-end pt-16 pb-8 sm:pb-12 lg:min-h-[calc(100svh-72px)]">
        <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-grey-200">
          {eyebrow.map((word, i) => (
            <span key={i} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden="true" className="size-1.5 rounded-full bg-amber" />}
              {word}
            </span>
          ))}
        </p>
        <h1
          id="hook-heading"
          className="mt-6 font-serif text-[clamp(3rem,min(9vw,13svh),7.5rem)] leading-[0.95] tracking-[-0.03em]"
        >
          {heading.map((line, i) => (
            <span key={i} className={`block ${i === heading.length - 1 ? "font-serif-italic text-amber italic" : ""}`}>
              {line}{" "}
            </span>
          ))}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-grey-200 sm:text-xl">{lede}</p>

        <div className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
          <Door door={hire} primary onActive={doorFor("hire")} />
          <Door door={work} primary={false} onActive={doorFor("work")} />
        </div>

        <div className="mt-7 flex flex-col gap-4 text-sm text-grey-300 sm:flex-row sm:items-center sm:gap-8">
          {waitlist.label && (
            <a
              href={waitlist.href}
              className="font-label text-xs font-semibold tracking-[0.16em] text-paper uppercase underline decoration-amber decoration-2 underline-offset-8"
            >
              {waitlist.label} →
            </a>
          )}
          {trust.length > 0 && (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {trust.map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  {i > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-grey-400" />}
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}

"use client";

import { useInView, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useIsEditing } from "@/components/editing-context";
import { Container } from "@/components/layout/Container";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { ProblemContent } from "@/content/types";
import { VendorConstellation } from "./VendorConstellation";

/** Scroll progress through the pinned section at which the vendors resolve into one ring. */
const RESOLVE_AT = 0.4;
/** Where one scroll lands: the top of the section, or well inside the resolved half. */
const SCATTERED_PROGRESS = 0;
const RESOLVED_PROGRESS = 0.75;

/** How long the one-step smooth scroll takes; wheel input is swallowed meanwhile. */
const STEP_LOCK_MS = 900;

/**
 * "The Hidden Cost of Fragmented Learning".
 *
 * Desktop: the section is pinned. Hovering a pain point opens it and lights
 * up the vendors it affects. A single scroll then resolves the scattered
 * vendors into one ring around Axon Arbor; the next scroll moves on.
 *
 * Mobile: no pinning. A scattered diagram opens the section and a connected
 * one closes it, resolving as it scrolls into view.
 */
export function ProblemSection({ content }: { content: ProblemContent }) {
  const { eyebrow, heading, lede, stat, resolvedStat, vendors, painPoints, resolution, hubLabel } = content;
  const sectionRef = useRef<HTMLElement>(null);
  const mobileResolvedRef = useRef<HTMLDivElement>(null);
  const mobileResolved = useInView(mobileResolvedRef, { once: true, amount: 0.6 });
  const [resolvedByScroll, setResolvedByScroll] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const resolvedRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = p >= RESOLVE_AT;
    resolvedRef.current = next;
    setResolvedByScroll(next);
  });

  // In the admin editor the story is laid out flat so every item can be clicked.
  const editing = useIsEditing();

  // While pinned, one wheel gesture flips between scattered and resolved.
  // Scrolling past either end, the keyboard and the scrollbar behave normally.
  useEffect(() => {
    if (editing) return;
    const pinQuery = window.matchMedia("(min-width: 64rem) and (min-height: 40rem)");
    let lockedUntil = 0;

    function onWheel(e: WheelEvent) {
      const el = sectionRef.current;
      if (!el || !pinQuery.matches || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const rect = el.getBoundingClientRect();
      const pinned = rect.top <= 1 && rect.bottom >= window.innerHeight - 1;
      if (!pinned) return;
      if (performance.now() < lockedUntil) {
        e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaY) < 4) return;
      const down = e.deltaY > 0;
      if (down === resolvedRef.current) return; // let the page scroll on past the story
      e.preventDefault();
      lockedUntil = performance.now() + STEP_LOCK_MS;
      const top = rect.top + window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + range * (down ? RESOLVED_PROGRESS : SCATTERED_PROGRESS), behavior: "smooth" });
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [editing]);
  const resolved = !editing && resolvedByScroll;
  const current = !resolved && hovered !== null ? hovered : -1;
  const highlighted = !resolved ? (painPoints[current]?.vendors ?? []) : [];

  return (
    <MotionProvider>
      <section
        ref={sectionRef}
        id="problem"
        aria-labelledby="problem-heading"
        className={editing ? "relative" : "relative pin:h-[200vh]"}
      >
        <div
          className={
            editing ? "" : "pin:sticky pin:top-[72px] pin:flex pin:h-[calc(100svh-72px)] pin:items-center"
          }
        >
          <Container className="grid gap-12 py-20 sm:py-24 lg:grid-cols-12 lg:gap-10 pin:py-6">
            <div className="lg:col-span-5">
              <Eyebrow>{eyebrow}</Eyebrow>
              <h2
                id="problem-heading"
                className="mt-5 font-serif text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-[clamp(2.25rem,3.5vw,3.25rem)]"
              >
                {heading}
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-grey-600 lg:text-base xl:text-lg">
                {lede}
              </p>

              <VendorConstellation
                vendors={vendors}
                resolved={false}
                stat={stat}
                resolvedStat={resolvedStat}
                hubLabel={hubLabel}
                labelSize={18}
                className="mx-auto mt-12 max-w-md lg:hidden"
              />

              {/* On desktop the list and the resolution share one grid cell and crossfade. */}
              <div className="mt-12 lg:mt-8 lg:grid">
                <ol
                  onMouseLeave={() => setHovered(null)}
                  className={`border-t border-grey-200 transition-opacity duration-500 ${editing ? "" : "lg:[grid-area:1/1]"} ${
                    resolved ? "lg:pointer-events-none lg:opacity-0" : ""
                  }`}
                >
                  {painPoints.map((point, i) => {
                    const active = current === i;
                    const open = editing || active;
                    const dimmed = !editing && current >= 0 && !active;
                    return (
                      <li
                        key={i}
                        onMouseEnter={() => setHovered(i)}
                        className={`border-b border-grey-200 py-5 transition-colors duration-500 lg:cursor-pointer lg:py-3.5 ${
                          dimmed ? "lg:text-grey-400" : ""
                        }`}
                      >
                        <div className="flex items-baseline gap-4">
                          <span
                            aria-hidden="true"
                            className={`font-label text-xs font-semibold tabular-nums transition-colors ${
                              active ? "text-ink" : "text-grey-500"
                            }`}
                          >
                            0{i + 1}
                          </span>
                          <div className="flex-1">
                            <h3 className="flex items-center gap-3 font-serif text-xl lg:text-[1.3rem]">
                              {point.title}
                              <span
                                aria-hidden="true"
                                className={`hidden h-2 w-2 bg-amber transition-transform duration-300 lg:block ${
                                  active ? "scale-100" : "scale-0"
                                }`}
                              />
                            </h3>
                            <div
                              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                                open ? "lg:grid-rows-[1fr] lg:opacity-100" : "lg:grid-rows-[0fr] lg:opacity-0"
                              }`}
                            >
                              <p className="overflow-hidden pt-2 leading-relaxed text-grey-600 lg:text-[0.95rem]">
                                {point.body}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div
                  className={`mt-12 transition-all duration-700 ${
                    editing
                      ? "lg:mt-10"
                      : `lg:mt-0 lg:self-center lg:[grid-area:1/1] ${
                          resolved
                            ? "lg:translate-y-0 lg:opacity-100"
                            : "lg:pointer-events-none lg:translate-y-4 lg:opacity-0"
                        }`
                  }`}
                >
                  <span aria-hidden="true" className="block h-0.5 w-12 bg-amber" />
                  <p className="mt-6 font-serif text-2xl leading-snug text-balance xl:text-[1.75rem]">
                    {resolution}
                  </p>
                </div>
              </div>

              <div ref={mobileResolvedRef} className="mx-auto mt-12 max-w-md lg:hidden">
                <VendorConstellation
                  vendors={vendors}
                  resolved={editing || mobileResolved}
                  stat={stat}
                  resolvedStat={resolvedStat}
                  hubLabel={hubLabel}
                  labelSize={18}
                />
              </div>
            </div>

            <div className="hidden lg:col-span-7 lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-16">
              {editing ? (
                <>
                  <VendorConstellation
                    vendors={vendors}
                    resolved={false}
                    stat={stat}
                    resolvedStat={resolvedStat}
                    hubLabel={hubLabel}
                    className="w-full max-w-xl"
                  />
                  <VendorConstellation
                    vendors={vendors}
                    resolved
                    stat={stat}
                    resolvedStat={resolvedStat}
                    hubLabel={hubLabel}
                    className="w-full max-w-xl"
                  />
                </>
              ) : (
                <VendorConstellation
                  vendors={vendors}
                  highlighted={highlighted}
                  resolved={resolved}
                  stat={stat}
                  resolvedStat={resolvedStat}
                  hubLabel={hubLabel}
                  className="w-full pin:max-w-[calc((100svh-72px-10rem)*1.11)]"
                />
              )}
            </div>
          </Container>
        </div>
      </section>
    </MotionProvider>
  );
}

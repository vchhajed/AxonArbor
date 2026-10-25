"use client";

import { useInView, useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useState } from "react";
import { useIsEditing } from "@/components/editing-context";
import { Container } from "@/components/layout/Container";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { ProblemContent } from "@/content/types";
import { VendorConstellation } from "./VendorConstellation";

const INTRO_END = 0.1;
const RESOLVE_AT = 0.72;

/** Maps scroll progress through the pinned section to a story stage. */
function stageFor(progress: number, steps: number) {
  if (progress < INTRO_END) return -1;
  if (progress >= RESOLVE_AT) return steps;
  const span = (RESOLVE_AT - INTRO_END) / steps;
  return Math.min(steps - 1, Math.floor((progress - INTRO_END) / span));
}

/**
 * "The Hidden Cost of Fragmented Learning".
 *
 * Desktop: the section is pinned while the visitor scrolls. Each pain point
 * lights up the vendors it affects, then the scattered vendors resolve into
 * one ring around Axon Arbor.
 *
 * Mobile: no pinning. A scattered diagram opens the section and a connected
 * one closes it, resolving as it scrolls into view.
 */
export function ProblemSection({ content }: { content: ProblemContent }) {
  const { eyebrow, heading, lede, stat, resolvedStat, vendors, painPoints, resolution, hubLabel } = content;
  const sectionRef = useRef<HTMLElement>(null);
  const mobileResolvedRef = useRef<HTMLDivElement>(null);
  const mobileResolved = useInView(mobileResolvedRef, { once: true, amount: 0.6 });
  const [stage, setStage] = useState(-1);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setStage(stageFor(p, painPoints.length));
  });

  // In the admin editor the story is laid out flat so every item can be clicked.
  const editing = useIsEditing();
  const resolved = !editing && stage === painPoints.length;
  // Out-of-range stages (end of the story, or fewer pain points after an edit) highlight nothing.
  const highlighted = !resolved ? (painPoints[stage]?.vendors ?? []) : [];

  return (
    <MotionProvider>
      <section
        ref={sectionRef}
        id="problem"
        aria-labelledby="problem-heading"
        className={editing ? "relative" : "relative pin:h-[280vh]"}
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
                  className={`border-t border-grey-200 transition-opacity duration-500 ${editing ? "" : "lg:[grid-area:1/1]"} ${
                    resolved ? "lg:pointer-events-none lg:opacity-0" : ""
                  }`}
                >
                  {painPoints.map((point, i) => {
                    const active = stage === i;
                    const open = editing || active;
                    const dimmed = !editing && stage >= 0 && !active;
                    return (
                      <li
                        key={i}
                        className={`border-b border-grey-200 py-5 transition-colors duration-500 lg:py-3.5 ${
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

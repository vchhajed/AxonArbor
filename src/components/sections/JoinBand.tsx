import Link from "next/link";
import { Container } from "@/components/layout/Container";
import type { HomeContent } from "@/content/types";

/** Fold 7: the closing call to join, with one door for organisations and one for experts. */
export function JoinBand({ heading, body, doors, secondary }: HomeContent["join"]) {
  return (
    <section id="join" aria-labelledby="join-heading" className="scroll-mt-20 bg-amber text-ink">
      <Container className="py-20 sm:py-28">
        <h2 id="join-heading" className="font-serif text-5xl leading-[1.02] tracking-tight text-balance sm:text-7xl">
          {heading}
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed">{body}</p>
        <ul className="mt-12 grid gap-4 md:grid-cols-2">
          {doors.map((door, i) => (
            <li key={i}>
              <Link
                href={door.href}
                className={`group flex h-full flex-col p-7 transition-colors duration-200 sm:p-9 ${
                  i === 0 ? "bg-ink text-paper hover:bg-paper hover:text-ink" : "bg-paper text-ink hover:bg-ink hover:text-paper"
                }`}
              >
                <span className="eyebrow opacity-80">{door.eyebrow}</span>
                <span className="mt-4 flex items-center justify-between gap-4 font-serif text-3xl tracking-tight">
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
                <span className="mt-4 leading-relaxed opacity-80">{door.body}</span>
              </Link>
            </li>
          ))}
        </ul>
        {secondary.label && (
          <p className="mt-10">
            <Link href={secondary.href} className="underline decoration-ink decoration-1 underline-offset-4 hover:decoration-2">
              {secondary.label} →
            </Link>
          </p>
        )}
      </Container>
    </section>
  );
}

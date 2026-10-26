import { Curated } from "@/components/sections/Curated";
import { DemoVideo } from "@/components/sections/DemoVideo";
import { Expertise } from "@/components/sections/Expertise";
import { Hideable } from "@/components/sections/Hideable";
import { HookHero } from "@/components/sections/HookHero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { JoinBand } from "@/components/sections/JoinBand";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { Testimonials } from "@/components/sections/Testimonials";
import type { HomeContent, ProgrammesContent } from "@/content/types";

/**
 * The home page: hook, problem, demo video, curated network, how it works
 * (with sample experts), testimonials and the closing call to join.
 */
export function HomeView({ home, programmes }: { home: HomeContent; programmes: ProgrammesContent }) {
  return (
    <>
      <HookHero {...home.hook} />
      <ProblemSection content={home.problem} />
      <Hideable show={home.demo.show}>
        <DemoVideo {...home.demo} />
      </Hideable>
      <Curated {...home.curated} areas={programmes.areas} />
      <HowItWorks {...home.howItWorks} />
      <Hideable show={home.expertise.show}>
        <Expertise {...home.expertise} />
      </Hideable>
      <Hideable show={home.testimonials.show}>
        <Testimonials {...home.testimonials} />
      </Hideable>
      <JoinBand {...home.join} />
    </>
  );
}

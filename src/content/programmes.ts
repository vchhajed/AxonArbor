import type { ProgrammesContent } from "./types";

export const programmes: ProgrammesContent = {
  meta: {
    title: "Our Programmes",
    description:
      "Leadership development, coaching and assessment, DEI and employee engagement programmes delivered by a network of specialist facilitators.",
    path: "/programmes",
  },

  header: {
    eyebrow: "Our programmes",
    heading: "Specialists in every niche, working as one.",
    lede: "At Axon Arbor we believe in the power of collaboration. Our experienced facilitators are subject matter experts in their own niche, and they come together to meet your organisation’s needs.",
  },

  intro: [
    "We serve your goals and partner with you all the way: from employee events and external speakers to memorable employee communication campaigns.",
    "We go a step further, too, helping you shape a strategy for an organisation that genuinely cares about, and invests in, the development of its people.",
  ],

  areas: {
    eyebrow: "Areas we cover",
    heading: "A facilitator for every area",
    items: [
      "Leadership Training",
      "Behavioural Topics",
      "Psychometric Assessments",
      "Executive Coaching",
      "Power BI",
      "Excel",
      "Gen AI",
      "Quality",
      "Lean Six Sigma",
      "POSH",
      "DEI",
      "CSR Strategy",
      "Team Building",
      "CXO Offsites",
    ],
    note: "We also run employee events, bring in external speakers and create memorable campaigns for employee communication.",
  },

  programmes: {
    eyebrow: "Signature programmes",
    heading: "Where we go deep",
    items: [
      {
        id: "diversity-equity-inclusion",
        title: "Diversity, Equity & Inclusion",
        body: "Programmes that build truly inclusive cultures, where everyone can do their best work and feel they belong.",
        listLabel: "Topics include",
        list: [
          "Implicit bias",
          "Allyship",
          "Psychological safety",
          "Microaggressions",
          "Inspiring next-gen teams",
          "Accessibility",
          "Hiring with inclusion",
        ],
      },
      {
        id: "coaching-mentoring-assessment",
        title: "Coaching, Mentoring & Assessment",
        body: "Deep, personalised conversations for your senior leaders, built on self-work, reflection and action plans to achieve their goals.",
      },
      {
        id: "leadership-development",
        title: "Leadership Development",
        body: "Learning journeys of four to six months that develop your next league of leaders.",
        listLabel: "Designed for",
        list: ["First-time managers", "Managers of managers", "Experienced managers"],
      },
      {
        id: "employee-engagement",
        title: "Employee Events, Engagement & Community",
        body: "Transform the culture of your organisation and deepen belonging with an annual calendar of activities and events that speak to your people.",
      },
    ],
  },

  capabilityStack: {
    eyebrow: "Our offerings",
    heading: "The Axon Arbor 360 Capability Stack",
    lede: "Four layers that work as one system, from understanding where you are today to changing how your organisation works.",
    ring: { value: "360", label: "Capability" },
    columns: [
      {
        title: "Assess & Diagnose",
        items: [
          "Assessments",
          "Culture surveys",
          "Competency mapping",
          "Coaching",
        ],
      },
      {
        title: "Build Capability",
        items: [
          "E-modules",
          "Micro-learning",
          "Leadership journeys",
          "Case-study methodology",
          "Soft skills",
          "Technical training",
          "POSH training",
          "Gen AI-enabled role plays",
        ],
      },
      {
        title: "Enable at Scale",
        items: [
          "Celebrity & industry speakers",
          "Employer branding",
          "Internal campaigns",
        ],
      },
      {
        title: "Drive Culture & Engagement",
        items: [
          "Team building",
          "CXO offsites",
          "Diversity, Equity, Inclusion & Belonging interventions",
        ],
      },
    ],
  },

  beyondTraining: {
    eyebrow: "Beyond training",
    heading: "Creating moments that move people",
    items: [
      {
        title: "Diversity, Equity & Inclusion",
        icon: "inclusion",
        body: "Building truly inclusive cultures where everyone can thrive.",
        href: "/programmes#diversity-equity-inclusion",
      },
      {
        title: "Celebrity & Industry Experts",
        icon: "speaker",
        body: "Learn from the best. Speakers who turn an event into something people remember.",
        href: "/about#partners",
      },
      {
        title: "Executive Coaching",
        icon: "coaching",
        body: "Coaching for leaders, grounded in the Appreciative Inquiry model.",
        href: "/programmes#coaching-mentoring-assessment",
      },
    ],
  },

  cta: {
    heading: "Build the programme your people need.",
    body: "Tell us about your teams and your goals. We’ll bring the right specialists to the table.",
    cta: { label: "Schedule a Consultation", href: "/contact" },
  },
};

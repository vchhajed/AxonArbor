import type { ContentKey } from "@/content/registry";

/**
 * Earlier code defaults of sections whose default copy has since changed.
 *
 * Publishing saves every section, so an untouched section is stored with the
 * old default text and would hide the new one. When a stored section still
 * equals one of these exactly, the new default is used instead. Sections an
 * admin actually edited never match, so their edits always win.
 */
export const RETIRED_DEFAULTS: Partial<Record<ContentKey, Record<string, unknown[]>>> = {
  home: {
    meta: [
      {
        title: "Learning & Development Solutions",
        description:
          "Axon Arbor replaces 8–10 fragmented L&D vendors with one partner: assessment, capability building, leadership journeys, coaching and culture, designed and delivered as one ecosystem.",
        path: "/",
      },
    ],
    problem: [
      {
        eyebrow: "The problem",
        heading: "The Hidden Cost of Fragmented Learning",
        lede: "Most CLOs and CHROs juggle eight to ten learning vendors at once. Each one solves a slice of the problem. None of them sees the whole.",
        stat: { value: "8–10", label: "vendors on a typical CLO’s roster" },
        resolvedStat: { value: "1", label: "partner. One connected ecosystem." },
        vendors: [
          "Leadership",
          "Compliance",
          "POSH",
          "Culture",
          "Coaching",
          "Assessments",
          "E-learning",
          "Speakers",
          "Offsites",
          "DEI&B",
        ],
        painPoints: [
          {
            title: "The silo effect",
            body: "Every vendor works in isolation, with its own brief, its own calendar and its own idea of success.",
            vendors: [4, 6, 7, 8],
          },
          {
            title: "No single view of impact",
            body: "Data sits with each provider in a different format, so no one can say what learning is doing for the business.",
            vendors: [5, 6, 4],
          },
          {
            title: "Uneven vendor quality",
            body: "Standards vary from one partner to the next, and so does the experience of your people.",
            vendors: [1, 2, 7, 9],
          },
          {
            title: "Weak integration",
            body: "Leadership, compliance and culture programmes rarely connect, so one never reinforces another.",
            vendors: [0, 1, 3],
          },
        ],
        resolution:
          "Axon Arbor exists to turn learning into a business advantage: a strategic driver of organisational success, not a reactive function.",
        hubLabel: "Axon Arbor",
      },
    ],
  },
};

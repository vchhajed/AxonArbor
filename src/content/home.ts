import type { HomeContent } from "./types";

export const home: HomeContent = {
  meta: {
    title: "Curated people development experts",
    description:
      "Axon Arbor brings all your people development needs under one roof: a curated list of trainers, facilitators, coaches and speakers with two decades of experience or more, matched to your brief. Join the waitlist.",
    path: "/",
  },

  hook: {
    eyebrow: ["Learning", "Leadership", "Belonging"],
    heading: ["Not crowded.", "Curated."],
    lede: "Axon Arbor brings all your people development needs under one roof: a curated list of trainers, facilitators, coaches and speakers with two decades of experience or more, matched to your brief.",
    backdrop: {
      video: "/video/hero-close-16x9.mp4",
      videoMobile: "/video/hero-close-9x16.mp4",
      poster: "/video/hero-close-16x9.jpg",
      posterMobile: "/video/hero-close-9x16.jpg",
    },
    hire: {
      eyebrow: "For organisations",
      label: "I want to hire an expert",
      href: "/join/company",
      backdrop: {
        video: "/video/hero-relief-16x9.mp4",
        videoMobile: "/video/hero-relief-9x16.mp4",
        poster: "/video/hero-relief-16x9.jpg",
        posterMobile: "/video/hero-relief-9x16.jpg",
      },
    },
    work: {
      eyebrow: "For experts",
      label: "I want to join as an expert",
      href: "/join/consultant",
      backdrop: { video: "", videoMobile: "", poster: "", posterMobile: "" },
    },
    waitlist: { label: "Join the waitlist", href: "#join" },
    trust: ["Woman-owned"],
  },

  problem: {
    eyebrow: "The problem",
    heading: "The Hidden Cost of Fragmented Learning",
    lede: "In most large companies the L&D team is small and most training is outsourced. So the people meant to shape strategy spend their days managing eight to ten vendors instead.",
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
        title: "Finding an expert runs on favours",
        body: "“Can anyone recommend someone for team building?” Every request means days of asking around WhatsApp groups, three proposals for procurement, then empanelment.",
        vendors: [0, 4, 7, 8],
      },
      {
        title: "The same three to five consultants",
        body: "Your reputation rides on a vendor’s delivery, so comfort wins over the right fit, and the outside-in perspective never arrives.",
        vendors: [0, 4, 5],
      },
      {
        title: "Silos, and no single view of impact",
        body: "Every vendor works to its own brief and keeps its own data, so no one can say what learning is doing for the business.",
        vendors: [1, 5, 6],
      },
      {
        title: "Uneven quality, weak integration",
        body: "Standards vary from one partner to the next, and leadership, compliance and culture programmes rarely reinforce each other.",
        vendors: [2, 3, 9],
      },
    ],
    resolution:
      "Finding the right fit takes more than a database. It takes experts who understand people development.",
    hubLabel: "Axon Arbor",
  },

  curated: {
    eyebrow: "Not crowded but curated",
    heading: "One partner. A curated network. The right expert for every brief.",
    lede: "A hand-picked network of domain and subject matter experts, each with two decades or more of experience. We understand your need, recommend the right expert, and stay accountable through delivery.",
    tiles: [
      { title: "Curated, not crowded", body: "Every expert is reviewed by people who know this market. No 1,000-name LinkedIn search.", icon: "" },
      { title: "The Axon Arbor promise", body: "One standard of excellence on every engagement, and one team accountable for it.", icon: "" },
      { title: "Outside-in perspective", body: "Fresh expertise beyond the three to five consultants you always use.", icon: "" },
      { title: "Supplier diversity", body: "A woman-owned business with more women than men in our network, supporting your ESG and DEI goals.", icon: "" },
      { title: "Local experts, lower cost", body: "A facilitator in your city means no flights or hotel stays.", icon: "" },
      { title: "One partner, every need", body: "Assessments, workshops, coaching, speakers, offsites and DEI: one partner instead of ten.", icon: "" },
    ],
    stats: [
      { value: "20+", label: "years: the minimum experience of our experts", show: true },
      { value: "", label: "lower cost per programme", show: false },
      { value: "", label: "hours of L&D admin saved per request", show: false },
      { value: "", label: "days to a shortlist", show: false },
    ],
    programmesLink: { label: "See all programmes", href: "/programmes" },
  },

  howItWorks: {
    eyebrow: "How it works",
    heading: "From brief to the right expert, with one partner throughout.",
    lede: "For organisations. Five steps, and Axon Arbor stays with you at every one.",
    steps: [
      { title: "Tell us about your organisation", body: "Your team size, location and what you’re looking to solve.", icon: "" },
      { title: "Describe what you need", body: "In your own words, for example “team building for 40 mid-level managers in Pune”.", icon: "" },
      { title: "We shortlist three relevant experts", body: "From our reviewed network, with why each could be a good fit.", icon: "" },
      { title: "An Axon Arbor expert helps you choose", body: "A free 30-minute discovery call to find the right one.", icon: "" },
      { title: "Meet, decide, deliver", body: "A three-way call with you, the expert and Axon Arbor, then delivery and feedback from both sides.", icon: "" },
    ],
    note: "Contact always goes through Axon Arbor, so quality and accountability stay with us.",
  },

  expertise: {
    show: true,
    eyebrow: "Depth of expertise",
    heading: "Depth you can see.",
    lede: "Matches are shown on expertise, not on names, so you judge the fit first.",
    note: "Illustrative profiles. Real matches are anonymised the same way.",
    cards: [
      {
        name: "Consultant A",
        specialty: "Executive coaching",
        experience: "24 years",
        certifications: "ICF PCC coach",
        workedWith: "BFSI and IT services",
        badge: "Professional",
      },
      {
        name: "Consultant B",
        specialty: "Psychometric assessments",
        experience: "21 years",
        certifications: "DISC and Hogan certified",
        workedWith: "Manufacturing and pharma",
        badge: "Expert",
      },
      {
        name: "Consultant C",
        specialty: "Leadership journeys",
        experience: "26 years",
        certifications: "Appreciative Inquiry practitioner",
        workedWith: "FMCG and automotive",
        badge: "Professional",
      },
      {
        name: "Consultant D",
        specialty: "Hospitality service excellence",
        experience: "20 years",
        certifications: "Certified hospitality trainer",
        workedWith: "Luxury hotels and restaurants",
        badge: "Expert",
      },
    ],
    logosHeading: "Our experts have worked with",
    showLogos: false,
    logos: [{ src: "", alt: "", width: 240, height: 96 }],
  },

  demo: {
    show: true,
    eyebrow: "See it in action",
    heading: "See how it works in one minute.",
    lede: "",
    media: {
      video: "/video/demo-16x9.mp4",
      videoMobile: "/video/demo-9x16.mp4",
      poster: "/video/demo-16x9.jpg",
      posterMobile: "/video/demo-9x16.jpg",
      captions: "",
    },
    cta: { label: "Join the waitlist", href: "#join" },
  },

  testimonials: {
    show: false,
    eyebrow: "In their words",
    heading: "What people development leaders say.",
    items: [{ quote: "", name: "", role: "HR Director, BFSI, 5,000+ employees", show: false }],
  },

  join: {
    heading: "Be among the first.",
    body: "Join the waitlist and we’ll be in touch before launch.",
    doors: [
      {
        eyebrow: "For organisations",
        label: "Register your organisation",
        body: "Company email only. We verify every organisation, usually within one working day.",
        href: "/join/company",
      },
      {
        eyebrow: "For experts",
        label: "Join as an expert",
        body: "Create your profile. Our team reviews it before it goes live, and your identity stays private.",
        href: "/join/consultant",
      },
    ],
    secondary: { label: "Rather talk now? Schedule a consultation", href: "/contact" },
  },
};

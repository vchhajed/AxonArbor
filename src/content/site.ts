import type { SiteContent } from "./types";

/** Canonical site URL. Not editable in the admin: it drives SEO metadata. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.axonarbor.in";

export const site: SiteContent = {
  name: "Axon Arbor",
  legalName: "Axon Arbor Consulting",
  tagline: "Learning · Leadership · Belonging",
  description:
    "Axon Arbor is a curated network of people development experts, based in Noida, India. One partner for assessments, workshops, coaching, speakers, offsites and culture.",
  logo: {
    src: "/brand/logo.png",
    alt: "Axon Arbor",
    width: 690,
    height: 615,
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Our Programmes", href: "/programmes" },
    { label: "The Hospitality Vertical", href: "/hospitality" },
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
  ],
  signIn: { label: "Sign in", href: "/sign-in" },
  headerCta: { label: "Join the waitlist", href: "/#join" },
  skipLinkLabel: "Skip to content",
  contact: {
    email: "info@axonarbor.in",
    phone: "+91 99997 12159",
    phoneHref: "tel:+919999712159",
    address: ["Jaypee Wishtown, Sector 128", "Noida, UP 201304", "India"],
  },
  footer: {
    blurb: "A curated network of people development experts. One partner for every brief, from diagnosis to delivery to culture.",
    exploreHeading: "Explore",
    contactHeading: "Get in touch",
    location: "Noida, India",
    copyright: "© Axon Arbor Consulting",
    legalLinks: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
    ],
  },
  notFound: {
    eyebrow: "Page not found",
    heading: "This branch doesn’t lead anywhere.",
    body: "The page you’re looking for may have moved when we refreshed our site.",
    button: { label: "Back to home", href: "/" },
  },
};

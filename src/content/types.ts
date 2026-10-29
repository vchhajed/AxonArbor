/**
 * Content model for the marketing site. The objects in src/content are the
 * defaults; the admin dashboard (/admin) stores edited copies in Supabase,
 * which are merged over these defaults at render time (see src/lib/content.ts).
 */

export type Link = {
  label: string;
  href: string;
};

export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type SectionIntro = {
  eyebrow?: string;
  heading: string;
  lede?: string;
};

export type PageMeta = {
  title: string;
  description: string;
  path: string;
};

export type IconName = "one-stop" | "tailored" | "experts" | "inclusion" | "speaker" | "coaching";

export type Item = {
  title: string;
  body: string;
  /** A built-in drawing (IconName), an uploaded image URL, or empty for none. */
  icon?: string;
};

export type LinkedItem = Item & { href?: string };

export type PainPoint = Item & {
  /** Indices into ProblemContent.vendors that this pain point highlights. */
  vendors: number[];
};

export type CapabilityColumn = {
  title: string;
  items: string[];
};

/** A looping background video: a landscape and a portrait cut, each with a still for slow connections. */
export type VideoBackdrop = {
  video: string;
  videoMobile: string;
  poster: string;
  posterMobile: string;
};

/** One of the two hero doors ("I want to hire" / "I want to work"). */
export type HeroDoor = Link & {
  /** Small label above the button text, e.g. "For organisations". */
  eyebrow: string;
  /** Backdrop shown while this door is hovered or focused. Empty video keeps the main one. */
  backdrop: VideoBackdrop;
};

export type HookContent = {
  /** Small label above the headline, one word per item, joined by amber dots. */
  eyebrow: string[];
  /** Headline lines; the last one is set in italics. */
  heading: string[];
  lede: string;
  backdrop: VideoBackdrop;
  hire: HeroDoor;
  work: HeroDoor;
  waitlist: Link;
  /** Short facts under the buttons. Only confirmed facts. */
  trust: string[];
};

export type Stat = {
  value: string;
  label: string;
  /** Off until the number is confirmed. */
  show: boolean;
};

export type ExpertCard = {
  name: string;
  specialty: string;
  experience: string;
  certifications: string;
  workedWith: string;
  badge: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  show: boolean;
};

export type DemoVideo = {
  video: string;
  videoMobile: string;
  poster: string;
  posterMobile: string;
  /** WebVTT captions file. */
  captions: string;
};

export type ProblemContent = SectionIntro & {
  stat: { value: string; label: string };
  resolvedStat: { value: string; label: string };
  vendors: string[];
  painPoints: PainPoint[];
  resolution: string;
  /** Label inside the amber hub once the vendors connect (first word on line one). */
  hubLabel: string;
};

export type CtaContent = {
  heading: string;
  body: string;
  cta: Link;
};

export type HomeContent = {
  meta: PageMeta;
  hook: HookContent;
  problem: ProblemContent;
  curated: SectionIntro & {
    tiles: Item[];
    stats: Stat[];
    programmesLink: Link;
  };
  howItWorks: SectionIntro & { steps: Item[]; note: string };
  expertise: SectionIntro & {
    show: boolean;
    note: string;
    cards: ExpertCard[];
    logosHeading: string;
    showLogos: boolean;
    logos: ImageAsset[];
  };
  demo: SectionIntro & { show: boolean; media: DemoVideo; cta: Link };
  testimonials: SectionIntro & { show: boolean; items: Testimonial[] };
  join: {
    heading: string;
    body: string;
    doors: (Link & { eyebrow: string; body: string })[];
    secondary: Link;
  };
};

export type Person = {
  name: string;
  role?: string;
  bio: string;
  image?: ImageAsset;
};

export type Partner = {
  kind: string;
  name: string;
  paragraphs: string[];
  list?: string[];
  stats?: { value: string; label: string }[];
  logo: ImageAsset;
};

export type PageHeaderContent = SectionIntro & { eyebrow: string };

export type Programme = {
  id: string;
  title: string;
  body: string;
  listLabel?: string;
  list?: string[];
};

export type ProgrammesContent = {
  meta: PageMeta;
  header: PageHeaderContent;
  intro: string[];
  areas: SectionIntro & { items: string[]; note: string };
  programmes: SectionIntro & { items: Programme[] };
  capabilityStack: SectionIntro & {
    show: boolean;
    ring: { value: string; label: string };
    columns: CapabilityColumn[];
  };
  beyondTraining: SectionIntro & { items: LinkedItem[] };
  cta: CtaContent;
};

export type HospitalitySegment = {
  id: string;
  title: string;
  paragraphs: string[];
  specialisms: string[];
  image?: ImageAsset;
};

export type HospitalityContent = {
  meta: PageMeta;
  header: PageHeaderContent;
  intro: string[];
  specialismsLabel: string;
  segments: HospitalitySegment[];
  cta: CtaContent;
};

export type AboutContent = {
  meta: PageMeta;
  header: PageHeaderContent;
  founder: {
    eyebrow: string;
    heading: string;
    paragraphs: string[];
    name: string;
    role: string;
    image: ImageAsset;
  };
  advisors: SectionIntro & { people: Person[] };
  facilitators: SectionIntro & { people: Person[] };
  partners: SectionIntro & { items: Partner[] };
  cta: CtaContent;
};

export type ContactFieldLabels = {
  name: string;
  organisation: string;
  role: string;
  email: string;
  phone: string;
  message: string;
};

export type ContactContent = {
  meta: PageMeta;
  header: PageHeaderContent;
  form: {
    labels: ContactFieldLabels;
    requiredNote: string;
    submitLabel: string;
    sendingLabel: string;
    successHeading: string;
    successBody: string;
    sendAnotherLabel: string;
    errorMessage: string;
    privacyNote: string;
    privacyLinkLabel: string;
  };
  details: {
    visitHeading: string;
    emailHeading: string;
    callHeading: string;
  };
};

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  points: string[];
};

export type LegalContent = {
  meta: PageMeta;
  header: PageHeaderContent;
  /** e.g. "22 October 2026" */
  updated: string;
  intro: string[];
  sections: LegalSection[];
};

export type SignInContent = {
  meta: PageMeta;
  header: PageHeaderContent;
  button: Link;
  helpText: string;
};

export type SiteContent = {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  logo: ImageAsset;
  nav: Link[];
  signIn: Link;
  /** Amber button at the right of the header. */
  headerCta: Link;
  skipLinkLabel: string;
  contact: {
    email: string;
    phone: string;
    phoneHref: string;
    address: string[];
  };
  footer: {
    blurb: string;
    exploreHeading: string;
    contactHeading: string;
    location: string;
    copyright: string;
    legalLinks: Link[];
  };
  notFound: {
    eyebrow: string;
    heading: string;
    body: string;
    button: Link;
  };
};

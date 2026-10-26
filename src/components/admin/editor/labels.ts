import type { Path } from "./paths";

/** Plain-English names for content fields, shown to admins. */
const LABELS: Record<string, string> = {
  meta: "Search engines & sharing",
  updated: "Last updated (date)",
  sections: "Sections",
  points: "Bullet points",
  legalLinks: "Legal links (bottom of footer)",
  privacyNote: "Privacy note under the form",
  privacyLinkLabel: "Privacy link text",
  title: "Title",
  description: "Description",
  eyebrow: "Small label above the heading",
  heading: "Heading",
  lede: "Intro text",
  body: "Text",
  label: "Text",
  href: "Links to",
  cta: "Button",
  primaryCta: "Main button",
  secondaryCta: "Second button",
  hook: "Top of page (video and two doors)",
  backdrop: "Background video",
  video: "Video file (wide screens, MP4)",
  videoMobile: "Video file (phones, portrait MP4)",
  poster: "Still image (wide screens)",
  posterMobile: "Still image (phones)",
  captions: "Captions file (.vtt)",
  hire: "“I want to hire” door",
  work: "“I want to work” door",
  waitlist: "Waitlist link",
  trust: "Short facts under the buttons",
  show: "Show on the site",
  curated: "Not crowded but curated",
  tiles: "Benefit tiles",
  programmesLink: "Link to all programmes",
  howItWorks: "How it works",
  steps: "Steps",
  expertise: "Depth of expertise (sample experts)",
  cards: "Expert cards",
  specialty: "Specialty",
  experience: "Experience",
  certifications: "Certifications",
  workedWith: "Worked with",
  badge: "Badge (Rising, Expert or Professional)",
  logosHeading: "Logo strip heading",
  showLogos: "Show the logo strip",
  logos: "Client logos",
  demo: "Demo video",
  media: "Video files",
  testimonials: "Testimonials",
  quote: "Quote",
  join: "Join the waitlist (bottom of page)",
  doors: "Doors",
  secondary: "Second link",
  headerCta: "Header button",
  problem: "The problem section",
  ecosystem: "One Partner section",
  pillars: "Pillars",
  capabilityStack: "360 Capability Stack",
  ring: "Ring in the middle",
  columns: "Columns",
  items: "Items",
  beyondTraining: "Beyond Training section",
  stat: "Big number (before)",
  resolvedStat: "Big number (after)",
  value: "Number",
  vendors: "Vendor names in the diagram",
  painPoints: "Pain points",
  resolution: "Closing line",
  header: "Page heading",
  intro: "Intro paragraphs",
  areas: "Areas we cover",
  note: "Note",
  programmes: "Programmes",
  listLabel: "List heading",
  list: "List",
  segments: "Sections",
  specialisms: "We specialise in (list)",
  specialismsLabel: "“We specialise in” label",
  paragraphs: "Paragraphs",
  image: "Image",
  logo: "Logo",
  founder: "Founder",
  advisors: "Advisors",
  facilitators: "Facilitators",
  people: "People",
  partners: "Partners",
  kind: "Type of partner",
  stats: "Numbers",
  role: "Role",
  bio: "Biography",
  name: "Name",
  form: "Contact form",
  labels: "Field labels",
  details: "Contact details panel",
  nav: "Main menu",
  signIn: "Sign-in link",
  skipLinkLabel: "“Skip to content” link (for keyboard users)",
  contact: "Contact details",
  address: "Address lines",
  phoneHref: "Phone link (tel:)",
  footer: "Footer",
  blurb: "Short description",
  notFound: "404 page (broken links)",
  button: "Button",
  helpText: "Help text",
  legalName: "Company legal name",
  tagline: "Tagline",
  copyright: "Copyright line",
  alt: "Image description (for screen readers and Google)",
  icon: "Drawing",
  illustration: "Drawing",
};

/** Names for the top-level sections of a page, where the generic label is ambiguous. */
const SECTION_LABELS: Record<string, string> = {
  cta: "Call-to-action band (bottom of page)",
  header: "Page heading",
  contact: "Contact details",
};

export function sectionLabel(key: string): string {
  return SECTION_LABELS[key] ?? humanise(key);
}

export function humanise(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "Hero › Main button › Text" style breadcrumb for a field. */
export function describePath(path: Path): string {
  const parts: string[] = [];
  for (const key of path) {
    if (typeof key === "number") parts[parts.length - 1] = `${parts[parts.length - 1] ?? "Item"} ${key + 1}`;
    else parts.push(humanise(key));
  }
  return parts.join(" › ");
}

/** Fields that read better as a multi-line box. */
export function isLongText(key: string | number, value: string) {
  return (
    value.length > 70 ||
    ["body", "lede", "description", "bio", "resolution", "blurb", "note", "helpText", "errorMessage", "successBody"].includes(
      String(key),
    ) ||
    typeof key === "number"
  );
}

/** Keys that hold technical values (links, file paths, ids), never shown as page text. */
export const NON_DISPLAY_KEYS = new Set([
  "href",
  "src",
  "id",
  "path",
  "phoneHref",
  "alt",
  "width",
  "height",
  "video",
  "videoMobile",
  "poster",
  "posterMobile",
  "captions",
]);

/** Keys the admin never needs to see. */
export const HIDDEN_KEYS = new Set(["width", "height", "path", "id"]);

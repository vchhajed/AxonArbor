# Axon Arbor — marketing site

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion. Deploys to Vercel.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (must pass with zero type/lint errors)
npm run lint
```

## Structure

```
src/
  app/
    (marketing)/        public pages: /, /programmes, /hospitality, /about, /contact, /sign-in
    admin/              admin dashboard: login, inline page editor, enquiries, images, history
    api/contact/        contact form route handler (stores enquiries in Supabase)
    sitemap.ts, robots.ts, icon.png, apple-icon.png, opengraph-image.png
  components/
    layout/             Header, Footer, Logo, Container
    sections/           HookHero, ProblemSection, VendorConstellation, PullQuote, Curated,
                        HowItWorks, Expertise, DemoVideo, Testimonials, JoinBand, Hideable,
                        CapabilityStack, BeyondTraining, CTABand, PageHeader, PersonCard
    forms/              ContactForm
    motion/             MotionProvider (Framer Motion, problem section only), Reveal (CSS)
    ui/                 Button, Eyebrow, SectionIntro
  views/                page bodies, shared by the public site and the inline editor
  content/              default copy as typed objects (types.ts describes the model)
  lib/                  content loader, Supabase clients, admin data access, stega markers
supabase/migrations/    SQL for the Axon Arbor tables, functions and media bucket
```

## Editing content (admin)

Admins edit the site at **/admin** without touching code:

- **Edit website**: the real pages with draft content. Click any text to change it, click any
  image to upload or pick a replacement, and use *All settings* for links, lists, menu items
  and search-engine text. Edits autosave as drafts.
- **Publish** copies drafts live and expires the `axon-arbor-content` cache tag, so the public
  site updates on the next visit with no redeploy. Every publish is kept in *Publish history*
  and can be restored.
- **Enquiries**: contact form submissions (read/unread, archive, notes, CSV export).
- **Images**: the `axon-arbor-media` storage bucket.

How it works: `src/content/*.ts` are the defaults. Supabase (`axon_arbor_content`, one draft
and one published row per page) stores edited copies, which `src/lib/content.ts` merges over
the defaults. In the editor every display string carries invisible zero-width markers
(`src/lib/stega.ts`) so a click on rendered text maps back to its field.

### Admin login and Supabase

Admin sign-in does **not** use Supabase Auth. The username and password come from the
environment (`ADMIN_USERNAME`, `ADMIN_PASSWORD`); a signed, http-only cookie
(`ADMIN_SESSION_SECRET`) keeps the admin signed in for 7 days. All admin reads and writes go
through server actions that check that cookie, then use the Supabase secret key
(`SUPABASE_SECRET_KEY`, server-only). Image uploads use short-lived signed upload URLs.

Project `supabase-charcoal-planet` is shared with other sites, so every object is prefixed
`axon_arbor_`. The public (anon) role can only read published content and submit the contact
form. Run `supabase/migrations/20261020000000_axon_arbor_cms.sql` once.

Copy `.env.example` to `.env.local` and fill it in. Add the same variables to the Vercel project.

## Home page: seven folds

1. **Hook**: greyscale video backdrop with two doors, *I want to hire an expert* (`/join/company`)
   and *I want to join as an expert* (`/join/consultant`). Hovering a door can swap to its own
   video (`hook.hire.backdrop`, `hook.work.backdrop`; leave the video empty to keep the main one).
2. **Problem**: the pinned vendor story and the pull quote.
3. **Not crowded but curated**: six benefits, numbers (each has *Show on the site*; only confirmed
   numbers are on), and the topic ticker.
4. **How it works** (`/#how-it-works`) and **Depth of expertise** (anonymised sample experts,
   labelled illustrative; optional client-logo strip, off until logos arrive).
5. **Demo video**: 16:9 on wider screens, 9:16 on phones, captions from a `.vtt` file. Loads on play.
6. **Testimonials**: off until real quotes arrive. No made-up testimonials.
7. **Be among the first** (`/#join`): the two sign-up doors, plus *Schedule a consultation*.

Sections and items switched off still appear in the inline editor, dimmed, so they can be filled
in first. Videos live in `public/video/` (H.264, `+faststart`; hero loops are muted, ~0.5 MB).

`src/lib/content/retired.ts` keeps earlier defaults: a stored section that still equals one of them
(nobody edited it) picks up the new default copy instead. Sections removed from the code are
dropped from stored documents when they load.

## Brand rules

- Colours: amber `#FFC107` (accents and fills only, never small text on white), black,
  white, and greys derived from black. The default Tailwind palette is disabled in
  `globals.css`, so other hues are unavailable by design.
- Type: Gelasio (headings), Inter (body), Montserrat (labels, buttons, stats).
- Logo: `public/brand/logo.png`, used unaltered (cropped only by CSS in `Logo.tsx`).
- British English throughout.

## Motion

- The problem section pins on desktop screens at least 640px tall (`pin:` variant) and
  resolves the vendor constellation as you scroll. Phones get a stacked version.
- Section reveals and the pull-quote use CSS scroll-driven animations (no JS).
- Everything respects `prefers-reduced-motion`.

## Environment

| Variable               | Default                    | Purpose                              |
| ---------------------- | -------------------------- | ------------------------------------ |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | (required) | Admin dashboard login |
| `ADMIN_SESSION_SECRET` | (required) | Signs the admin session cookie (long random string) |
| `SUPABASE_SECRET_KEY` | (required for admin) | Supabase secret key, server-only |
| `NEXT_PUBLIC_SITE_URL` | `https://www.axonarbor.in` | Canonical URLs, sitemap, OG metadata |
| `NEXT_PUBLIC_SUPABASE_URL` | project URL | Supabase project (defaults to supabase-charcoal-planet) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | project key | Publishable key (safe to expose; RLS protects data) |

## TODO

- Contact form: also notify the team by email (`src/app/api/contact/route.ts`).
- Phase 2: consultant and organisation dashboards, onboarding.

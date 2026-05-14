# freshprints.dev — Project Context

This file is read at the start of every Claude Code session. It contains all the context needed to work on this project. Read it before doing anything else.

## What This Is

Personal/professional website for Kyle. Brand: "Fresh Prints" (business) + Kyle's personal brand (freelance). Domain: freshprints.dev.

Kyle is a mechanical designer, software developer, and game developer. The site needs to function as a portfolio, generate contracting business, sell products, and feel unique through a game-style hub UI.

## Operating Rules (Always Follow)

1. PowerShell on Windows. Use only: ls, cd, mkdir, cat, npm, npx.
2. Never use Get-ChildItem or PowerShell flags.
3. Never chain commands with semicolons.
4. Install one npm package per command. Never combine.
5. Don't run verification commands between every step. Verify once at the end with `npm run dev`.
6. Use design tokens for every color, font, spacing, and easing value. Never hardcode. Token source of truth is src/themes/digital/tokens.css (src/styles/tokens.css is a stub).
7. Default to Claude Code for all changes — Kyle does not edit files manually.
8. Do not iterate on broken approaches. If something fundamentally fails, restart that piece fresh with a corrected design.

## Stack

- Vite + React (JSX, no TypeScript)
- React Router v6 (BrowserRouter)
- Framer Motion (page transitions, micro-interactions)
- Tailwind CSS v4 (@tailwindcss/vite plugin)
- Three.js + react-three-fiber + drei (hub background, 3D viewers)
- React Hook Form (intake wizard, contact)
- Recharts (lab dashboard charts)
- @google/model-viewer (CDN, in index.html — for CAD .glb files)
- Deploy: Vercel

## Architecture

- Path alias `@` → `/src` (configured in vite.config.js)
- Routes defined in App.jsx wrapped in AnimatePresence
- Pages in src/pages/, components grouped by feature in src/components/
- Data lives in src/data/ — single source of truth, no fetching needed
- Hooks in src/hooks/
- Styles in src/styles/ (tokens, global, animations)

## Design System

Brand colors:
- Background base: #0A0A0F (near-black blue-black)
- Surface: #111116
- Primary accent: #00C8FF (cold electric cyan) — system / active color
- Secondary accent: #FFB347 (amber/gold) — Fresh Prints brand, highlights
- Text primary: #F0F0F8

Typography:
- Display (headings): Bebas Neue
- Mono (UI labels, code): IBM Plex Mono
- Body: DM Sans

Fonts loaded from Google Fonts via index.html.

Light mode is a blueprint aesthetic — white bg, blue technical ink, grid overlay. Toggled via `data-theme="light"` on documentElement (handled by useTheme hook).

## Category Color Map

Used on tags, project cards, skill nodes:
- software → #00C8FF (cyan)
- games → #FFB347 (amber)
- engineering → #A0A0B8 (gray)
- ai → #8B5CF6 (violet)
- content → #FBBF24 (gold)

## Status Color Map

- ACTIVE / PRODUCTION → #22C55E (green)
- BETA → #F59E0B (amber)
- STABLE / PROFESSIONAL → #00C8FF (cyan)
- CONCEPT / RESEARCH → #8B5CF6 (violet)
- IN_DEVELOPMENT → #F59E0B (amber) — display label "IN DEVELOPMENT" (space not underscore). Data value uses underscore.
- AVAILABLE → #FFFFFF (white) — white dot with `box-shadow: 0 0 6px rgba(255,255,255,0.6)` + `border: 1px solid rgba(180,180,180,0.4)` for light-bg visibility. Signals "ready to engage."

Status values are defined in `src/components/ui/Badge.jsx` (Digital), `src/components/standard/StandardCard.jsx`, `src/components/standard/pages/StandardPortfolio.jsx`, and `src/components/standard/pages/StandardProjectPage.jsx`. Each has its own `STATUS_COLORS`/`STATUS_DOT` map — add new statuses to all four when adding new types. CSS tokens live in each theme's `tokens.css`. Display label rendering uses `.replace(/_/g, ' ')` for underscore-to-space conversion.

## Phase Plan

- [x] Phase 1 — Foundation (scaffold + design system + UI primitives + page shells)
- [x] Phase 2 — Hub + Landing (the entry experience, game UI navigation)
- [x] Phase 3 — Portfolio (data file, filterable grid, project deep-dive pages, CAD viewer)
- [x] Phase 4 — Skills + Services (skill matrix node graph, services packages, intake wizard)
- [x] Phase 5 — Lab (Predictinator widget, Plutus simulator, Architect demo, CAD models)
- [x] Phase 6 — Store + Media (product grid, devlog grid, featured video)
- [x] Phase 7 — About + Contact + Polish (about page, contact page, forms backend, SEO, mobile audit, lazy loading)
- [x] Phase 8 — Sound FX System (Web Audio API synthesizer, digital pack, useSound hook, SoundToggle button)
- [x] Phase 9 — Theme Architecture Refactor (multi-theme system, CSS scoped to data-ui, ThemeProvider context, DevThemeSwitcher)
- [x] Phase 10 — Mobile Fix Pass + Admin Button Placeholder (2026-05-10)
- [x] Phase 11 — Stats Foundation + Admin Auth (2026-05-10)
- [x] Phase 14a — Standard UI Foundation (2026-05-11)
- [x] Phase 14b — Standard UI Inner Pages (2026-05-12)

## Phase 10 — Mobile Audit Results (2026-05-10)

### What was fixed

**Issue 1 — Horizontal overflow:** Added `overflow-x: hidden` to both `html` and `body` globally in `src/styles/global.css`. Previously only applied to `body` at `max-width: 768px`.

**Issue 2 — Hub corner text overlaps:** Corner elements in `Hub.jsx` now respond to viewport width:
- Below 768px: font shrinks to 10px (CSS class `hub-corner`), top-left label shortens from "FRESH PRINTS // OPERATIONS TERMINAL" to "OPERATIONS TERMINAL", bottom-right shortens from "LAST SYNC: YYYY-MM-DD" to "SYNC: MM.DD", bottom-left gets `text-overflow: ellipsis`.
- Below 480px: bottom-left and bottom-right corners are hidden entirely (`hub-corner-bl` / `hub-corner-br` display:none). Only top-left label and top-right ONLINE badge remain.

**Issue 3 — Bottom cluster button overlap:** `HubSystemControls.jsx` cluster container now uses CSS class `hub-controls-cluster` with `gap: var(--space-4)` (increased from `--space-3`). On mobile < 768px gap reduces to `--space-3` and button padding tightens. On very narrow < 380px, cluster allows `flex-wrap` to a second row. All buttons have `white-space: nowrap`.

**Issue 4 — Admin button placeholder:** Added ADMIN button (leftmost) to the hub bottom cluster. Order: ADMIN | SOUND | CHANGE UI. Clicking opens `AdminLoginModal` — a polished placeholder modal with disabled password input and "AUTHENTICATE" button. Auth and dashboard ship in Phase 11.

### New files
- `src/components/admin/AdminLoginModal.jsx` — placeholder modal shell; Phase 11 will wire real auth inside it

### Note
The admin button is a UI placeholder only. No authentication is implemented. Phase 11 delivers: real auth flow, stats dashboard, session tracking, analytics.

## Phase 10 — Third Mobile Pass (2026-05-10)

### Radial drawer math fixed
`MobileRadial` in `Hub.jsx` rewritten with correct center-point geometry:
- Container is now `width: 0; height: 0` — a zero-size anchor at the exact viewport center via `display: flex; align: center; justify: center` on the fixed outer wrapper.
- Node buttons use `left: -(nodeW/2); top: -(NODE_H/2)` to center their own box at the origin, then Framer Motion `x: tx, y: ty` translates each to its radial position.
- Center toggle button wrapped in a plain `div` with `transform: translate(-50%, -50%)` (not a motion element, avoiding Framer Motion transform override risk).
- New radius formula: `min(w * 0.28, (w/2) - (nodeW/2) - 16, 130)` — proportional to viewport, safety-margined, capped at 130px. At 375px, radius ≈ 105px.

### Comprehensive audit — pages fixed
- **Services.jsx** — `minmax(480px, 1fr)` grid overflowed on any viewport < 480px. Fixed to `minmax(min(480px, 100%), 1fr)`.
- **Lab.jsx** — inline-flex terminal stats readout could overflow. Wrapped in `overflowX: auto` scroll container.
- **Admin.jsx** — 200px fixed sidebar + main content layout broke on mobile. Added `.admin-body` / `.admin-sidebar` classes; collapses to stacked column at 640px.
- **AdminOverview.jsx** — 1fr 1fr bottom grid (top paths + recent events) had no mobile breakpoint. Added `.admin-bottom-grid` collapses to 1fr at 640px.
- **Portfolio.jsx** — Converted inline containerStyle to `className="page-container"` for responsive side padding (32px desktop → 16px mobile).
- **LabExperiment.jsx** — Top nav strip can overflow long experiment names; added `flexWrap: wrap`. Added responsive padding via `.lab-experiment-container` class.
- **global.css** — Added `overflow-x: hidden` to `html` element (body already had it).

### Pages audited with no changes needed
- Landing (`/`) — centered content, no overflow
- Portfolio grid / featured strip — existing media queries handle collapse
- ProjectPage — hero uses clamp(), metrics bar collapses at 640px, all grids wrap
- Skills — MobileAccordion path renders below 768px, no overflow
- DecisionTree — `minmax(220px, 1fr)` correctly collapses to 1 col on narrow screens
- Store — ProductGrid collapses at 900px → 540px; featured strip collapses at 768px
- Media — VideoGrid collapses at 900px → 540px; FeaturedVideo collapses at 768px
- About — all subcomponents use flexWrap or page-container responsive padding
- Contact — layout-two-col has 768px breakpoint; ContactForm is 100% width
- PlutusSimulator — stats grids collapse at 640px; ResponsiveContainer on charts
- PredictinatorWidget — collapses to 1fr at 768px; table has overflowX: auto
- CADViewer — collapses at 768px; cad-specs-grid goes 4→2 col

## Key Design Decisions

**Hub is the navigation.** No traditional navbar. Hub at /hub is the central command center with 8 nodes (Portfolio, Skills, Services, Lab, Store, Media, About, Contact). Every other page has a HubReturnButton component fixed top-left.

**Sections inside the hub feel professional, not gamey.** The hub has the game UI feel. The pages it leads to are clean, premium, conversion-focused. The transitions are the game; the content is the product.

**All animations respect prefers-reduced-motion** via the useReducedMotion hook.

**Data is local, not fetched.** Every project, service, product, skill is defined in src/data/ files. To add a new project, edit projects.js. No CMS, no API.

## Data File Schemas

**projects.js** — each project: { slug, name, tagline, description, category[], status, featured, timeline, stack[], metrics[], thumbnail, images[], model (optional .glb path), hasDemo, demoUrl, cta, relatedSlugs[], protected }

**services.js** — each service: { id, category, name, packages[{name, priceFrom, deliverables[], timeline}], customAvailable }

**experiments.js** — each: { slug, name, status, description, component (string ref) }

**products.js** — each: { id, type ('digital'|'software'|'physical'), name, description, price, includes[], purchaseUrl, image }

**skills.js** — three tiers: disciplines[], tools[], specializations[]. Each tool/spec has parentId linking up the tree, and projectLinks[] linking down to portfolio slugs.

## Hub Architecture Notes (Phase 2)

**Node count:** 8 nodes, labels: PORTFOLIO, SKILLS, SERVICES, LAB, STORE, MEDIA, ABOUT, CONTACT

**Layout:** 3-2-3 flex rows. Auto-honeycomb offset works naturally: Row 1 (3 nodes = 452px wide) and Row 3 center in the container; Row 2 (2 nodes = 296px wide) auto-centers, landing at 78px offset — exactly half a hex+gap.

**Keyboard adjacency map** (nodeId → ArrowKey → nextNodeId):
```
0→Right:1, 0→Down:3
1→Left:0, 1→Right:2, 1→Down:3
2→Left:1, 2→Down:4
3→Up:0, 3→Right:4, 3→Down:6
4→Up:2, 4→Left:3, 4→Down:6
5→Up:3, 5→Right:6
6→Up:4, 6→Left:5, 6→Right:7
7→Up:4, 7→Left:6
```

**PageChrome pattern:** `<PageChrome />` sits inside `<BrowserRouter>` but outside `<Routes>` (rendered in `AppInner`). It reads `useLocation().pathname` and renders `<HubReturnButton />` on every route except `/` and `/hub`.

**Terminal trigger:** Backtick key (`) anywhere on the page, except when focus is on INPUT or TEXTAREA. Escape or backtick again closes. Mounted once in `AppInner` via `useTerminal()` hook.

**Terminal commands:** help, ls, ls projects, cd [route], whoami, clear, exit

## Portfolio Component Map (Phase 3)

**Pages:**
- `src/pages/Portfolio.jsx` — main index: header, FeaturedStrip, FilterBar, ProjectGrid
- `src/pages/ProjectPage.jsx` — deep-dive: uses all project subcomponents below

**Portfolio subcomponents** (`src/components/portfolio/`):
- `ProjectCard.jsx` — reusable card (sizes: default | featured | compact), image fallback via onError
- `FeaturedStrip.jsx` — 1 large + 2 stacked layout using getFeaturedProjects()
- `FilterBar.jsx` — pill filter row; active filter held in Portfolio local state
- `ProjectGrid.jsx` — 3-col CSS grid, positions [0,4,7] span 2 cols; AnimatePresence on filter change
- `ProjectHero.jsx` — 60vh hero image with gradient overlay, meta strip
- `MetricsBar.jsx` — full-width surface strip, 4-col metric callouts
- `VisualGallery.jsx` — image grid + lightbox (keyboard nav, Esc closes); placeholder if images empty
- `ModelViewer.jsx` — wraps `<model-viewer>` web component; renders only if project.model is set
- `RelatedProjects.jsx` — compact ProjectCard row for related slugs

**Utilities:**
- `src/utils/categoryAssets.js` — getCategoryColor(category), getCategoryIcon(category) — SVG icons per category

## Skills Matrix Architecture (Phase 4)

**Three tiers:** disciplines → tools → specializations. All data in `src/data/skills.js`.

**Desktop graph:** SVG node graph inside `src/components/skills/SkillMatrix.jsx`. Discipline hexagon nodes in a row; clicking one animates tool nodes in below with SVG connector lines (drawn via ref measurement after a 320ms delay for Framer Motion to settle). Clicking a tool opens `SkillDetail.jsx` as a fixed right-side panel (360px). Backdrop click closes. Specialization pills appear in a third row below the selected tool.

**Mobile:** Accordion in `MobileAccordion` (inside SkillMatrix.jsx). Each discipline expands to list its tools. Tapping a tool opens `SkillDetail` as a bottom sheet.

**Components:** `src/components/skills/` — SkillMatrix.jsx, SkillNode.jsx (three variants: discipline/tool/specialization), SkillDetail.jsx.

## Services Component Map (Phase 4)

**Pages:** `src/pages/Services.jsx` — accepts `/services/:category` param to pre-select a tab.

**Components:** `src/components/services/`
- `AvailabilityIndicator.jsx` — pulsing dot pill from siteStatus.availability
- `DecisionTree.jsx` — 3-card decision helper (hire / store / consult)
- `ServiceCategoryTabs.jsx` — ALL / ENGINEERING / SOFTWARE / GAMES / AI / CONTENT tab bar
- `ServiceCategoryBlock.jsx` — one service with header + PackageCard grid + custom scope link
- `PackageCard.jsx` — name, price, timeline, deliverables (cyan square bullets), INQUIRE button
- `ProcessSection.jsx` — 4-step DISCOVERY → SCOPE → BUILD → HANDOFF timeline
- `TestimonialsPlaceholder.jsx` — placeholder cards, ready for real testimonials in Phase 7

**IntakeWizard:** 5-step modal in `src/components/services/IntakeWizard.jsx`. Steps in `src/components/services/intake/`:
- Step 1: service type (6 icon buttons)
- Step 2: scope (3 radio cards)
- Step 3: timeline + budget (button selectors)
- Step 4: description textarea + name + email (React Hook Form validation)
- Step 5: summary + success state (no backend yet — TODO in Phase 7)

**Pattern:** `onInquire(serviceId)` prop on PackageCard bubbles up to Services page which opens IntakeWizard with `prefillServiceType`. Wizard uses `useForm()` at the top level, passing `register`/`watch`/`setValue`/`getValues` into each step.

## Store + Media Architecture (Phase 6)

**Store (`src/pages/Store.jsx`):**
- No per-product routes — detail opens in `ProductDetailModal` (portal to document.body)
- External products link out to Gumroad via `window.open`. Physical custom-print links to `/contact?topic=custom-print` internally
- `StoreFeaturedStrip` (60/40 layout), `ProductGrid` (3-col, AnimatePresence filter), `ProductDetailModal`
- All in `src/components/store/`

**Media (`src/pages/Media.jsx`) — Phase 15b restructure:**
- Data: `src/data/media.js` — `media.tabs[]`, `media.videos[]` (each `{ id (YouTube ID), title, description, tabId, duration, publishedAt }`), `media.featuredVideoId`, `media.newsletterCopy`
- Helpers: `getThumbnailUrl(id)`, `getThumbnailFallbackUrl(id)`, `getEmbedUrl(id)`, `getVideosForTab(tabId)`, `getTabById(id)`
- **No more `youtubeId` field** — videos use `id` as the YouTube video ID directly
- **No more `series` field** — videos use `tabId` linking to `media.tabs[]`
- `FeaturedVideo` — shown only when `media.featuredVideoId` is set and matches a video in `media.videos[]`
- `SeriesFilterTabs` — tabs from `media.tabs[]`, "ALL" prepended
- `VideoGrid` — 3-col, AnimatePresence filter; videos play in `VideoLightbox` (portal, iframe embed, ESC+backdrop closes)
- `VideoLightbox` — iframe uses `getEmbedUrl(video.id)` → `?autoplay=1&rel=0`
- `NewsletterStrip` — copy sourced from `media.newsletterCopy`; sends to `/api/contact` with `type: 'newsletter'`
- Coming-soon empty state: Standard = card+emoji, Retro = Win95 dialog box
- Hero subscribe buttons: `socialLinks.youtube.general` (@loudd) + `socialLinks.youtube.docs` (@LouddDocs)
- To add real videos: add entries to `media.videos[]` with `id` = YouTube video ID, set `media.featuredVideoId` to feature one

## Lab Architecture (Phase 5)

**Two-page structure:**
- `src/pages/Lab.jsx` — index page, blueprint grid background, experiment card grid
- `src/pages/LabExperiment.jsx` — slug-based wrapper page, dynamically renders experiment component

**Data:** `src/data/labExperiments.js` — `experiments[]` array + `getExperimentBySlug(slug)`. Each experiment: `{ slug, name, shortName, status, classification, description, category, component, accentColor }`.

**Component map** (`src/components/lab/`):
- `ExperimentCard.jsx` — card for the lab index, navigates to /lab/:slug on click
- `experiments/PredictinatorWidget.jsx` — stats + recharts accuracy chart + picks table
- `experiments/PlutusSimulator.jsx` — strategy/period selector, LCG-seeded chart, results panel
- `experiments/ArchitectDemo.jsx` — upload zone simulation, animated progress lines, 12-check validation report
- `experiments/CADViewer.jsx` — model-viewer web component, model picker sidebar, spec grid

**Adding a new experiment:**
1. Add entry to `src/data/labExperiments.js`
2. Create component at `src/components/lab/experiments/YourComponent.jsx`
3. Import and add to `COMPONENT_MAP` in `src/pages/LabExperiment.jsx`

**CAD model data:** `src/data/cadModels.js` — source of truth for all browsable models. Each entry: `{ id, name, description, file, source, relatedProjectSlug, thumbnail }`. To add a model: drop the `.glb` into `public/3d_files/`, add an entry to `cadModels.js`. Files with "PCB" in the name default to source `'KiCAD'`; all others default to `'Fusion 360'`. Set `relatedProjectSlug` to link a model to a portfolio project. 6 real models are wired up as of Phase 15a (inventory: Subaru Brat door handle, EverGreens 7 Iron, Mighty Max audio box, Touch LED art panel, Touch LED PCB compact, Touch LED PCB square). Files live in `public/3d_files/` (not `public/models/`).

## When Starting a New Phase

The user will say something like "build Phase 3" or "do Phase 2". Read this CLAUDE.md, confirm what phase number, then build. The user will provide any phase-specific data (project list, service prices, etc.) directly in the prompt.

---

## Deployment (Phase 7+)

**Deploy target:** Vercel. Connect repo, set env vars, push to main — Vercel auto-detects Vite.

**Required environment variables on Vercel:**
- `RESEND_API_KEY` — from resend.com (used to send emails from /api/contact)
- `CONTACT_TO_EMAIL` — Kyle's actual receiving email address
- `CONTACT_FROM_EMAIL` — a verified sender in Resend (e.g. `noreply@freshprints.dev`)

**Custom domain:** Add `freshprints.dev` in Vercel dashboard → Domains. Point DNS to Vercel nameservers.

**Plausible analytics:** Create account at plausible.io → add `freshprints.dev` as a site. Free tier works. The script tag is already in index.html.

**OG image:** `/public/og-image.svg` — a static SVG, served at `https://freshprints.dev/og-image.svg`. Referenced in `<meta property="og:image">` in index.html.

---

## Forms Architecture (Phase 7+)

Single serverless endpoint at `/api/contact.js` (Vercel auto-routes to `/api/contact`).

Handles three form types, distinguished by the `type` field in the POST body:
- `type: 'contact'` — from the Contact page form
- `type: 'newsletter'` — from the NewsletterStrip on Media page
- `type: 'intake'` — from the IntakeWizard on Services/About pages

All three forms show: loading state during submission, success state on 200, error state on failure (with fallback to direct email).

Email delivery via Resend (`resend` npm package, already installed).

---

## About Page Architecture (Phase 7)

**Page:** `src/pages/About.jsx`

**Subcomponents** (`src/components/about/`):
- `AboutStatus.jsx` — "// CURRENTLY" card: location, active project, availability indicator, last shipped
- `AboutStory.jsx` — "// THE STORY" — 3 paragraphs, max-width 800px
- `AboutCapabilities.jsx` — "// I BUILD" — 5-col responsive grid with category icons and colors
- `AboutStack.jsx` — "// THE STACK" — pill links from skills.js tools array to /skills?focus=[id]
- `AboutConnect.jsx` — "// CONNECT" — 2x2 responsive grid: YouTube, GitHub, LinkedIn, Email

Final CTA opens IntakeWizard (same component as Services page).

---

## Contact Page Architecture (Phase 7)

**Page:** `src/pages/Contact.jsx` — 2-col desktop, stacked mobile

**Subcomponents** (`src/components/contact/`):
- `ContactForm.jsx` — React Hook Form, fields: name/email/topic/message/subscribe checkbox, POST to /api/contact
- `ContactDirect.jsx` — 4 method cards (email, youtube, github, linkedin) + commission callout box

---

## Sound System (Phase 8)

**Architecture: 3 layers**
1. `src/sound/SoundManager.js` — Singleton. Owns AudioContext (lazy-init on first interaction), master volume (0.3), mute state (persisted to `fp-sound-muted` in localStorage), pack registry.
2. `src/sound/packs/digital.js` — Default pack. 13 sounds synthesized via Web Audio API (no files). Registered on app load via `main.jsx` import.
3. `src/sound/useSound.js` — Hook: `{ play, isMuted, toggleMute }`. React-friendly wrapper. Syncs with `prefers-reduced-motion` changes.

**SoundToggle** (`src/components/layout/SoundToggle.jsx`) — Fixed bottom-right button, hidden on `/`. Matches HubReturnButton styling.

**Available sounds:** `click`, `hover`, `activate`, `select`, `terminalOpen`, `terminalClose`, `terminalKey`, `terminalSubmit`, `modalOpen`, `modalClose`, `success`, `error`, `toggle`

**Wired in:**
- `Button.jsx` — hover + click (opt-out via `silent` prop)
- `Hub.jsx` HexNode — activate (hover/focus), select (click)
- `Terminal.jsx` — terminalOpen/Close, terminalKey (per keystroke), terminalSubmit (Enter)
- `ProductDetailModal.jsx` — modalOpen/Close
- `VideoLightbox.jsx` — modalOpen/Close
- `IntakeWizard.jsx` — modalOpen/Close, success/error on submit
- `ContactForm.jsx` — success/error on submit
- `NewsletterStrip.jsx` — success/error on submit

**Adding sounds:** Add function to the pack file, add key to the exported object, call `play('name')` from any component.

**Adding a new pack:** `soundManager.registerPack('pantheon', pantheonPack)` then `soundManager.setPack('pantheon')`. Components need zero changes.

**AudioContext:** Lazy-initialized on first `play()` call to comply with browser autoplay policy.

**prefers-reduced-motion:** Automatically suppresses all sounds when set in OS.

---

## Theme System (Phase 9)

**Architecture: CSS scoped to `data-ui` attribute, React context for switching.**

### Selectors
- Dark: `[data-ui="digital"] { ... }` in `src/themes/digital/tokens.css`
- Light: `[data-ui="digital"][data-mode="light"] { ... }` in same file
- Blueprint grid overlay: `[data-ui="digital"][data-mode="light"] body::after` in `global.css`

### Flash prevention
`index.html` contains an inline sync script (runs before CSS) that reads `fp-theme` and `fp-mode` from localStorage and sets `data-ui`/`data-mode` on `<html>` immediately.

### Theme manifests (`src/themes/*/manifest.js`)
Each theme exports: `{ id, label, status, navigation, hasSoundFx, soundPack, fonts, hidden? }`

- `digital` — status: complete, navigation: hub, soundPack: digital
- `pantheon` — status: stub
- `standard` — status: stub, navigation: navbar, hasSoundFx: false
- `funky` — status: stub, hidden: true

### Registry (`src/themes/registry.js`)
Exports: `themes`, `themeIds`, `getTheme(id)`, `getAvailableThemes()`, `getCompleteThemes()`

### ThemeProvider (`src/themes/ThemeProvider.jsx`)
- Wraps the entire app (outside BrowserRouter)
- Reads `?theme=` URL param first, then `fp-theme` localStorage
- Reads `?mode=` URL param first, then `fp-mode` localStorage
- Sets `document.documentElement.dataset.ui` and `.dataset.mode` on change
- Calls `soundManager.setPack(manifest.soundPack)` when theme changes
- Exposes context: `{ themeId, mode, manifest, setTheme, toggleMode }`

### useTheme hook
- `src/themes/useTheme.js` — re-export for clean imports (`import { useTheme } from '@/themes/useTheme'`)

### DevThemeSwitcher (`src/components/dev/DevThemeSwitcher.jsx`)
- Dev-only (no-ops in production builds)
- Ctrl+Shift+T to open/close, ESC closes
- Pills for each non-hidden theme, MODE toggle button
- Position: fixed bottom-right, above SoundToggle

### Adding a new theme
1. Create `src/themes/yourtheme/manifest.js`
2. Create `src/themes/yourtheme/tokens.css` — scope all tokens to `[data-ui="yourtheme"]`
3. Create `src/themes/yourtheme/fonts.css` if using different fonts
4. Import manifest in `src/themes/registry.js`
5. Import tokens.css in `src/main.jsx`

### Operating rule update
Token source of truth is now `src/themes/digital/tokens.css` (not `src/styles/tokens.css`). The old tokens.css is a stub comment only.

---

## TODO / Future Work

- Replace placeholder GitHub URL in `AboutConnect.jsx` and `ContactDirect.jsx` with Kyle's actual GitHub
- Replace placeholder LinkedIn URL with Kyle's actual LinkedIn
- Replace `kyle@freshprints.dev` with Kyle's actual email if different
- Sound packs for Pantheon/Standard/Funky (structure ready, just needs pack files)
- Light/dark toggle UI button visible on pages (ThemeProvider ready, just needs a UI toggle component for end users)
- Per-section content refinement based on Kyle's review
- Wire newsletter to Buttondown/ConvertKit if separate list management is needed (currently sends email via Resend)
- Sound design tuning pass (volume levels, individual sound character)
- Pantheon/Standard/Funky full theme implementation (manifests are stubs)

---

## Stats System — Phase 11 Foundation (2026-05-10)

- **Database:** Vercel Postgres (Neon), schema in `db/schema.sql`, initialize via `npm run db:init`
- **Driver:** `@neondatabase/serverless` — uses `POSTGRES_DATABASE_URL` env var (auto-set by Neon integration)
- **Required env vars:**
  - `POSTGRES_DATABASE_URL` — auto-provisioned by Vercel/Neon integration
  - `ADMIN_PASSWORD_HASH` — generate via `npm run gen:hash`, set in `.env.local` AND Vercel dashboard
- **Auth:** Cookie-based (`fp_admin`), 7-day expiry, bcrypt password hashing (rounds=12), HttpOnly Secure cookie. Admin sessions stored in `admin_sessions` table.
- **Shared lib:** `lib/db.js` (Neon client), `lib/auth.js` (session helpers)
- **API endpoints:**
  - `POST /api/track` — ingest events (page_view, scroll_depth, time_on_page)
  - `POST /api/auth/admin` — authenticate (returns session cookie)
  - `POST /api/auth/logout` — revoke session
  - `GET  /api/auth/check` — validate current session
  - `GET  /api/admin/overview` — stats dashboard data (auth-gated)
- **Frontend tracker:** `src/tracking/` — `Tracker.js` (singleton, 5s auto-flush, keepalive on pagehide), `sessionUtils.js` (visitor/session IDs in localStorage/sessionStorage), `useTracker.js` hook, `AutoTrackers.jsx` (mounted in AppInner)
- **Auto-tracked events:** `page_view`, `scroll_depth` (25/50/75/100%), `time_on_page`
- **Admin route:** `/admin` — protected page, auth-checks on mount, redirects to `/` if unauthenticated
- **Admin UI:** Header + sidebar (OVERVIEW nav) + `AdminOverview` component (4 stat cards, 30-day area chart, top paths, recent events)
- **Phase 12** will expand the dashboard. **Phase 13** will instrument custom events throughout the site.

---

## Content Updates (2026-05-11)

- **Predictinator 5000 → Predictinator** — display name only; slug `predictinator-5000` unchanged. Updated in `projects.js`, `labExperiments.js`, `siteStatus.js`.
- **Architect → Architect (Archie)** — display name updated in `projects.js` and `labExperiments.js`. Lab shortName `ARCHITECT` unchanged.
- **Arena Systems → Hot Potato** — slug changed from `roblox-arena` to `hot-potato`, full project data replaced with real metrics (2,000+ monthly players, 91% approval). `relatedSlugs` in Pantheon and project cross-refs updated.
- **SolidWorks → Siemens NX** — skill ID changed (`solidworks` → `siemens-nx`), `toolIds` in Mechanical discipline updated, `assembly-design` specialization `parentId` updated, `fresh-prints-prototypes` stack updated, services.js deliverable text updated.
- **Jogger project added** — UE5 Blueprints endless runner, Q1 2026, status ACTIVE. Added to `projects.js`, `siteStatus.js`, and as a cross-ref in `pantheon.relatedSlugs`. Unreal/Blueprint tool `projectLinks` updated to include `jogger`.
- **Portfolio header** — "SELECTED WORK" → "CREATIVE ENGINEER".
- **ParticleField extracted** — moved from inline in `Landing.jsx` to reusable `src/components/effects/ParticleField.jsx`. `Landing.jsx` imports it unchanged. `Portfolio.jsx` renders it conditionally (`themeId === 'digital'`) behind a `pointer-events: none` fixed overlay; page content sits at `z-index: 1` above it.
- **Project status updates (2026-05-13)** — Pantheon: ACTIVE → IN_DEVELOPMENT. Jogger: ACTIVE → IN_DEVELOPMENT. Hot Potato: STABLE → ACTIVE. Architect (Archie): CONCEPT → BETA. Fresh Prints - Production & Design: STABLE → AVAILABLE. `siteStatus.js` updated to match; Hot Potato and Architect entries added.

---

## Phase 14a — Standard UI Foundation (2026-05-11)

**Standard is now the default theme.** First-time visitors (no `fp-theme` in localStorage) land in Standard UI.

### What was built

- **`src/themes/standard/manifest.js`** — updated to `status: 'complete'`, `layoutType: 'traditional'`, Geist fonts.
- **`src/themes/standard/fonts.css`** — loads Geist + Geist Mono via Google Fonts (`@import`).
- **`src/themes/standard/tokens.css`** — full dark + light token sets plus shared typography, spacing, layout utilities. All scoped to `[data-ui="standard"]`.
- **`index.html`** — Geist preconnect + link tags added; flash prevention script updated to default `fp-theme='standard'` and resolve `'auto'` mode from `prefers-color-scheme`.
- **`src/main.jsx`** — imports `standard/tokens.css` and `standard/fonts.css` alongside Digital.
- **`src/themes/registry.js`** — default fallback changed from `digital` to `standard`.
- **`src/themes/ThemeProvider.jsx`** — default theme `'standard'`; mode preference stores `'dark'|'light'|'auto'`; system color scheme auto-detection with `matchMedia` listener; `setMode(pref)` exposed in context; URL param changed from `?theme=` to `?ui=` (legacy `?theme=` still works).

### New components

- **`src/components/ui/UIPicker.jsx`** — user-facing modal to switch between Standard / Digital and set mode (Dark / Light / Auto). Triggered from Standard chrome; opens on `Escape`-closeable backdrop.
- **`src/components/standard/StandardLayout.jsx`** — `s-layout` + `s-main` wrapper with StandardNav, StandardFooter, UIPicker state.
- **`src/components/standard/StandardNav.jsx`** — sticky transparent nav with blur, mode toggle (sun/moon), UI picker icon, desktop links, mobile hamburger with AnimatePresence slide-down.
- **`src/components/standard/StandardFooter.jsx`** — 3-col footer (Brand / Site / Connect), pulls connect links from `src/data/socialLinks.js`, "Switch to Operations Terminal →" opens UIPicker.
- **`src/components/standard/StandardButton.jsx`** — primary / secondary / ghost variants using Standard tokens. Separate from Digital's `Button.jsx`.
- **`src/components/standard/StandardCard.jsx`** — image + eyebrow + title + description card with hover-lift, status badge overlay, Standard tokens.
- **`src/pages/StandardLanding.jsx`** — 6-section landing page: Hero (engineering SVG motif + hero text), Featured Work (3 cards), Capabilities (6-card grid), About Snippet (2-col), From the Lab (2 cards), Contact CTA.

### Routing changes (`src/App.jsx`)

- `AppInner` reads `themeId` — renders `StandardLayout` wrapper when `'standard'`, Digital `PageChrome + SoundToggle + Terminal` when `'digital'`.
- Route `/` now renders `<HomeRoute />` which returns `<StandardLanding />` or `<Landing />` based on `themeId`.

### Design tokens

Standard has its own token namespace (`--bg-base`, `--accent`, `--text-primary`, etc.) completely separate from Digital's (`--color-bg-base`, `--color-accent-primary`, etc.). Inner pages (portfolio, about, etc.) still use Digital tokens in 14a — **Phase 14b** will restyle them for Standard.

### Default theme change

- Old default: `digital`
- New default: `standard`
- Force Digital via URL: `?ui=digital`
- Force Standard via URL: `?ui=standard`

### Geist fonts

Added to `index.html` via Google Fonts preconnect + link. Also imported in `src/themes/standard/fonts.css`. Both methods load together so the fonts are always available in Standard context.

---

## Phase 14b — Standard UI Inner Pages (2026-05-12)

All 10 inner pages now have Standard UI variants. Digital versions are preserved and untouched.

### Architecture

- Top-level page files (`src/pages/*.jsx`) are now thin theme switchers — they check `themeId` and render the correct variant.
- Digital implementations moved to `src/pages/digital/Digital[PageName].jsx`.
- Standard implementations live at `src/components/standard/pages/Standard[PageName].jsx`.

### Standard pages built

- `StandardPortfolio` — hero, filter pills, responsive project grid with hover cards
- `StandardProjectPage` — sticky back bar, hero, two-column overview+stack+metrics, gallery, model viewer, CTA, related projects
- `StandardAbout` — hero, portrait+intro, story, capabilities grid, skills pills by discipline, social connect grid, CTA
- `StandardContact` — hero, two-column: social method cards + react-hook-form (POST /api/contact)
- `StandardServices` — hero, sticky category tabs, package cards with checkmark deliverables, 4-step process, availability status, IntakeWizard CTA
- `StandardSkills` — hero, sticky discipline tabs, AnimatePresence-animated detail view (tools + specializations), related projects
- `StandardLab` — hero, 2-column experiment grid with accentColor previews, newsletter strip
- `StandardLabExperiment` — back bar, hero, experiment widget wrapped in card, about panel, related experiments
- `StandardStore` — hero, filter pills, product grid, Standard-native product detail modal (no Digital tokens)
- `StandardMedia` — hero with YouTube subscribe buttons, featured video lightbox, series tab filter, video grid, newsletter strip

### Shared Standard components added

- `StandardReveal.jsx` — scroll-reveal wrapper (framer-motion, respects prefers-reduced-motion)
- `StandardSectionHeader.jsx` — eyebrow + heading + subtitle pattern
- `StandardPillFilter.jsx` — filter pill bar used in Portfolio, Store, Media
- `StandardButton.jsx` — updated to accept `target` and `rel` props for external links

### Token bridge

`src/themes/standard/tokens.css` now includes Digital-name aliases (`--color-bg-base`, `--color-text-primary`, etc.) that map to Standard equivalents. This allows shared components like `IntakeWizard` to render correctly inside Standard context.

---

## Phase 15a — Retro UI Foundation (2026-05-13)

Third UI variant. Late 90s / early 2000s desktop computing aesthetic — Win95/98, CD-ROM software. NOT vaporwave, NOT cyberpunk. No fake desktop or draggable windows — the retro feeling comes from beveled cards/buttons, pixel typography, Win95 color palette, and synthesized audio.

### Manifest
- `src/themes/retro/manifest.js` — id: 'retro', status: 'complete', layoutType: 'traditional', soundPack: 'retro', fonts: Press Start 2P / Tahoma / VT323
- Registered in `src/themes/registry.js`

### Tokens (`src/themes/retro/tokens.css`)
- Scoped to `[data-ui="retro"]` — single mode, no light/dark variants
- `--bg-base: #008080` (teal desktop), `--bg-elevated: #C0C0C0` (Win95 gray), `--bg-content: #FFFFCC` (cream)
- Bevel variables: `--bevel-highlight`, `--bevel-light`, `--bevel-shadow`, `--bevel-dark`
- Title bar: `--titlebar-active-start: #000080`, `--titlebar-active-end: #1084D0`
- Zero border-radius everywhere (`--radius-*: 0`)
- Utility classes: `.retro-raised`, `.retro-inset`
- Digital-name aliases included for shared component compatibility

### CRT Effects
- `[data-ui="retro"][data-crt="on"]` adds scanline + vignette via `body::before` / `body::after`
- Default: `data-crt="on"`, persisted in `localStorage` key `fp-retro-crt`
- Toggle via status bar CRT button

### Fonts (`src/themes/retro/fonts.css`)
- Google Fonts: Press Start 2P (display — used sparingly), VT323 (mono)
- Body: `'MS Sans Serif', Tahoma, 'Microsoft Sans Serif', Arial, sans-serif` (system fonts)
- Added to `index.html` font link and imported in `src/main.jsx`

### Sound Pack (`src/sound/packs/retro.js`)
- 13 sounds: boot, click, hover, select, error, success, modalOpen, modalClose, floppyRead, floppyWrite, notification, keyType, crash
- Aliases map Digital-named keys (activate, toggle, terminalKey, etc.) so shared components work
- `boot` = Win95-style multi-note startup chime (~2 sec)
- Registered via `soundManager.registerPack('retro', retroPack)`

### Per-theme Sound Mute
- `SoundManager` now has `setActiveTheme(id)` — loads mute state from per-theme localStorage keys
- `fp-sound-muted-retro` (default: **false** — Retro is unmuted by default)
- `fp-sound-muted-digital` (default: true)
- `soundManager` emits `fp-sound-state-change` CustomEvent on state changes
- `useSound` hook subscribes to this event to keep `isMuted` state in sync
- `ThemeProvider` calls `soundManager.setActiveTheme(id)` on theme change

### Layout System
- `src/components/retro/RetroLayout.jsx` — flex-column wrapper with toolbar + main panel + status bar + UIPicker
- `src/components/retro/RetroToolbar.jsx` — sticky title bar (gradient) + menu bar (nav links + UI picker button); collapses to hamburger < 768px
- `src/components/retro/RetroStatusBar.jsx` — sticky bottom: READY | Page: /path | CRT toggle + mute toggle + [UI] button + clock

### Primitive Components
- `src/components/retro/RetroButton.jsx` — raised bevel, pressed state, focus outline, variant: default/primary/link; plays click/hover sounds
- `src/components/retro/RetroCard.jsx` — raised bevel panel with optional title bar (blue gradient)

### Boot Sequence (`src/components/retro/RetroBootSequence.jsx`)
- Controlled by `fp-retro-booted` in localStorage — plays once, never again
- Phase 1: BIOS text lines appear one-by-one on black screen
- Phase 2: Win95 splash with logo window, progress bar, boot chime audio
- Skip: click anywhere or press any key
- Exported: `shouldShowBoot()` helper

### RetroLanding (`src/pages/RetroLanding.jsx`)
- Checks `shouldShowBoot()` on mount — shows `RetroBootSequence` if needed
- Sections: Hero panel (PORTFOLIO heading + intro + CTA buttons), Featured Work (3 project cards), About snippet + Services tiles (side-by-side), Contact CTA (dialog box style)

### Routing
- `HomeRoute` component in `App.jsx` renders `<RetroLayout><RetroLanding /></RetroLayout>` when retro, Standard otherwise
- `PageLayout` now handles three themes: standard → StandardLayout, retro → RetroLayout, digital → raw
- `RetroLanding` lazy-loaded

### UIPicker Updates
- Three themes shown: Standard, Digital, Retro — each with a mini inline preview card
- Mode picker (Dark/Light/Auto) hidden when `themeId === 'retro'`
- `getThemeHome('retro')` returns `/home`

### ThemeProvider Updates
- `themeId === 'retro'`: sets `data-crt` from localStorage, removes `data-mode`
- Leaving retro: removes `data-crt`, restores `data-mode`
- Calls `soundManager.setActiveTheme(id)` on every theme change

### Phase 15b
Will create dedicated Retro variants of inner pages (Portfolio, About, Services, etc.). Inner pages currently render Standard variants inside RetroLayout chrome.

---

## Pantheon Wars — Game (Discoverability Phase)

The game is a persistent Greek-mythology browser MMO (Mafia Wars-style) built end to end as a Lab experiment and portfolio piece. It is NOT rendered inline in the Lab — it has its own full-page chrome at `/games/pantheon-wars`.

### Entry points
- **Lab:** Registered in `src/data/labExperiments.js` with `external: true`, `externalUrl: '/games/pantheon-wars'`. Lab cards detect the `external` flag and navigate directly to the game route instead of `/lab/:slug`. Cards show "PLAY LIVE" badge (Standard) or `// PLAY LIVE ↗` (Digital).
- **Portfolio:** The Pantheon UE5 project page (`/portfolio/pantheon`) has a "Play the Web Companion →" secondary CTA button in both Standard and Digital variants, plus a one-line note about the MMO. Implemented via `project.slug === 'pantheon'` check in the CTA section.
- **Direct URL:** `/lab/pantheon-wars` redirects to `/games/pantheon-wars` via `<Navigate replace />` in `src/pages/LabExperiment.jsx`.

### Routes
All game routes live under `PantheonWarsShell` (provides `PantheonWarsContext`):
- `/games/pantheon-wars` — Dashboard (built)
- `/games/pantheon-wars/quests` — Quest board (built)
- `/games/pantheon-wars/signup` — Signup (built)
- `/games/pantheon-wars/login` — Login (built)
- `/games/pantheon-wars/inventory` — Stub: Coming Soon
- `/games/pantheon-wars/shop` — Stub: Coming Soon
- `/games/pantheon-wars/temples` — Stub: Coming Soon
- `/games/pantheon-wars/pvp` — Stub: Coming Soon
- `/games/pantheon-wars/leaderboard` — Stub: Coming Soon
- `/games/pantheon-wars/profile` — Stub: Coming Soon (shows stat_points alert if player has unspent points)

### Dashboard nav treatment
Dead routes show as disabled nav buttons at opacity 0.5 with a "SOON" badge in the corner. Non-clickable. Tooltip on hover. The `comingSoon: true` flag on each `NAV_ITEMS` entry controls this.

### GDD
Full game design document: `pantheon_wars/docs/PANTHEON-WARS-GDD.md`

### Phase B1 — Profile / Stat Allocation (complete)
- Players can now spend earned `stat_points` on Attack and Defense (1 point per +1 stat increment)
- `/games/pantheon-wars/profile` is now fully functional; the Dashboard PROFILE nav button is live (no longer Coming Soon)
- Stat values are visible on Dashboard; allocation happens at `/games/pantheon-wars/profile`

### Phase B2/B3 — Inventory, Shop, Leaderboard (complete)
- `pw_items` (50 items), `pw_inventory`, `pw_quest_loot` tables added to schema + seed
- Real loot drops wired into quest completion (picks from `pw_quest_loot`, inserts to `pw_inventory`)
- Full UI: `Inventory.jsx` (slot grid, filter, equip/sell), `Shop.jsx` (drachma/glory tabs), `Leaderboard.jsx` (type + faction filters)
- Dashboard INVENTORY, SHOP, LEADERBOARD nav buttons unlocked

### API consolidation (Vercel 12-function limit fix)
Vercel Hobby plan allows max 12 serverless functions. All 14 Pantheon Wars API files were consolidated into 2:
- `api/games/pantheon-wars/auth.js` — handles: signup, login, logout, me (via `?action=` routing)
- `api/games/pantheon-wars/game.js` — handles: quests, complete, inventory, equip, unequip, sell, shop, buy, leaderboard, allocate
- Total API files: 8 (auth.js, game.js + contact.js, track.js, auth/admin.js, auth/check.js, auth/logout.js, admin/overview.js)
- All frontend fetch() URLs updated to use `?action=` params

### Next phase (B4/B5)
Temples (passive income) + PvP (combat, target list, combat log).

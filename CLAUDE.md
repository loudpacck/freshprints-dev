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

**Media (`src/pages/Media.jsx`):**
- `FeaturedVideo` — YouTube thumbnail + lightbox on click; "WATCH ON YOUTUBE" external button separate
- `SeriesFilterTabs` — tabs from `media.series` array in data file
- `VideoGrid` — 3-col, AnimatePresence filter; videos play in `VideoLightbox` (portal, iframe embed, ESC closes)
- `NewsletterStrip` — UI-only, shows success state for 3s; wire up to Buttondown/ConvertKit in Phase 7
- All in `src/components/media/`
- YouTube thumbnails use `maxresdefault.jpg` → `mqdefault.jpg` → gradient fallback chain
- Replace placeholder `youtubeId: 'dQw4w9WgXcQ'` values in `src/data/media.js` with real IDs when videos are live

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

**CAD model placeholders:** `CADViewer.jsx` uses Google model-viewer sample GLBs. When real `.glb` files land in `public/models/`, update the `src` strings in the `MODELS` array at the top of `CADViewer.jsx`.

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

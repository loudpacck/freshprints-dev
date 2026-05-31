# freshprints.dev — Project Reference

> Dense technical reference for AI assistants. Read top-to-bottom before touching any code.
> Generated: 2026-05-14 | Source of truth: CLAUDE.md + actual code

---

## 1. PROJECT IDENTITY

**What it is:** Personal/professional website for Kyle DeBord (Massachusetts). Dual brand:
- **Fresh Prints** — mechanical prototyping & design business
- **Kyle DeBord** — software + game developer freelance identity

**Purpose:** Portfolio + contracting lead-gen + product sales + unique game-style navigation experience.

**Live URL:** https://freshprints.dev  
**GitHub:** https://github.com/loudpacck/freshprints-dev  
**Hosting:** Vercel (Hobby plan — 12 serverless function max, currently 8 used)  
**DNS:** Cloudflare (gray cloud, DNS-only, NOT proxied — do not proxy or Vercel breaks)  
**Local path:** `B:\freshprints-dev`  
**Build tool:** Claude Code running in PowerShell on Windows 11

### PowerShell Rules (Non-Negotiable)
- Commands: `ls`, `cd`, `mkdir`, `cat`, `npm`, `npx` only
- Never use `Get-ChildItem` or any PowerShell-specific flags
- Never chain commands with semicolons
- One `npm install` per command — never combine packages
- No `&&` chaining between commands
- Verify once at the end with `npm run dev` (or `vercel dev` for full-stack)
- API routes only work with `vercel dev`, NOT `npm run dev`

---

## 2. FULL TECH STACK

### Frontend Framework + Build
| Package | Version | Purpose |
|---|---|---|
| `react` | 18.3.1 | UI framework |
| `react-dom` | 18.3.1 | DOM renderer |
| `vite` | 6.0.5 | Build tool + dev server |
| `@vitejs/plugin-react` | 4.3.1 | JSX transform for Vite |

### Styling
| Package | Version | Purpose |
|---|---|---|
| `tailwindcss` | 4.2.4 | Utility CSS (v4 — uses `@tailwindcss/vite` plugin, no config file) |
| `@tailwindcss/vite` | 4.2.4 | Tailwind v4 Vite integration |

### Routing + Animation
| Package | Version | Purpose |
|---|---|---|
| `react-router-dom` | 7.15.0 | Client-side routing (BrowserRouter) |
| `framer-motion` | 12.38.0 | Page transitions, micro-animations, AnimatePresence |

### 3D + Media
| Package | Version | Purpose |
|---|---|---|
| `three` | 0.184.0 | 3D engine base |
| `@react-three/fiber` | 8.18.0 | React renderer for Three.js (hub background) |
| `@react-three/drei` | 9.122.0 | Three.js helpers (OrbitControls, etc.) |
| `@google/model-viewer` | CDN (index.html) | Web component for CAD `.glb` files |

### Forms + Charts
| Package | Version | Purpose |
|---|---|---|
| `react-hook-form` | 7.75.0 | IntakeWizard + Contact form validation |
| `recharts` | 3.8.1 | Lab dashboard charts (Predictinator, Plutus) |

### Backend + Database
| Package | Version | Purpose |
|---|---|---|
| `@neondatabase/serverless` | 1.1.0 | Neon Postgres driver (used in all API routes) |
| `dotenv` | 17.4.2 | Env var loading in scripts |

### Auth + Security
| Package | Version | Purpose |
|---|---|---|
| `bcryptjs` | 3.0.3 | Password hashing (12 rounds) for both admin and player auth |
| `ua-parser-js` | 2.0.9 | User agent parsing in tracking API (import as `{ UAParser }` named import) |

### Email
| Package | Version | Purpose |
|---|---|---|
| `resend` | 6.12.3 | Transactional email from `/api/contact` |

### Dev Tools
| Package | Version | Purpose |
|---|---|---|
| `eslint` | (devDep) | Linting |

### Path Alias
- `@` → `/src` (configured in `vite.config.js`)
- All imports use `@/` prefix: `import Foo from '@/components/Foo'`

---

## 3. HOSTING & DEPLOYMENT

### Vercel Configuration
- **Plan:** Hobby (12 serverless function max — HARD LIMIT)
- **Function slots used:** 8 of 12
- **Auto-deploy:** Push to `main` → Vercel builds and deploys automatically
- **Config file:** `vercel.json` — SPA rewrite (`/*` → `/index.html`) + security headers
- **Local full-stack dev:** `vercel dev` (NOT `npm run dev` — API routes won't work otherwise)
- **Build command:** `npm run build` (Vite)

### vercel.json Summary
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [X-Content-Type-Options, X-Frame-Options: DENY, X-XSS-Protection]
}
```

### DNS + Domain
- **Domain:** freshprints.dev (apex) + www.freshprints.dev
- **DNS:** Cloudflare — gray cloud (DNS only, NOT proxied)
- Both apex + www point to Vercel nameservers/CNAMEs
- Proxying through Cloudflare breaks Vercel — keep it off

### Scripts
| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Frontend-only dev server |
| `npm run build` | `vite build` | Production build |
| `npm run db:init` | `node scripts/init-db.js` | Create all DB tables (safe to re-run, uses IF NOT EXISTS) |
| `npm run db:seed:pw` | `node scripts/seed-pantheon-wars.js` | Seed game items, quests, temples (safe re-run via ON CONFLICT DO NOTHING) |
| `npm run gen:hash` | `node scripts/gen-admin-hash.js` | Generate bcrypt hash for ADMIN_PASSWORD_HASH |

---

## 4. THEME ARCHITECTURE

Three complete UIs, one planned stub. Each is a fully scoped CSS + layout system.

### Theme Registry (`src/themes/registry.js`)
| ID | Status | Navigation | Sound Pack | Default? |
|---|---|---|---|---|
| `standard` | complete | navbar (StandardLayout) | none | **YES — default for new visitors** |
| `digital` | complete | hub (Hub.jsx) | digital | opt-in |
| `retro` | complete | toolbar (RetroLayout) | retro | opt-in |
| `pantheon` | stub | — | — | no |
| `funky` | stub, hidden | — | — | no |

### How Themes Work
- `ThemeProvider` (`src/themes/ThemeProvider.jsx`) wraps the entire app outside `<BrowserRouter>`
- Sets `document.documentElement.dataset.ui` (theme) and `document.documentElement.dataset.mode` (dark/light/auto)
- All CSS tokens scoped to `[data-ui="X"]` — zero leakage between themes
- Default: `standard`. Override via `?ui=digital` or `?ui=retro` URL params (legacy `?theme=` also works)
- Flash prevention: inline sync script in `index.html` reads `localStorage` and sets `data-ui`/`data-mode` before CSS parses
- `fp-theme` localStorage key for theme, `fp-mode` for dark/light/auto preference

### Theme Entry Points
- **`/`** → `Landing.jsx` — always Digital aesthetic (no theme switching, it's the splash)
- **`/home`** → `HomeRoute` — Standard: `StandardLayout + StandardLanding`, Retro: `RetroLayout + RetroLanding`
- **`/hub`** → `Hub.jsx` — Digital only
- All inner pages: `PageLayout` wrapper adds `StandardLayout` or `RetroLayout` when not Digital

### CSS Token Scoping
- Standard tokens: `src/themes/standard/tokens.css` → `[data-ui="standard"]`
- Digital tokens: `src/themes/digital/tokens.css` → `[data-ui="digital"]`
- Retro tokens: `src/themes/retro/tokens.css` → `[data-ui="retro"]`
- Token source of truth per theme: always the theme's own `tokens.css`
- Standard tokens include Digital-name aliases (`--color-bg-base`, etc.) for shared component compatibility
- Retro tokens also include Digital-name aliases for the same reason

### Per-Theme Font Stacks
| Theme | Display | Mono | Body |
|---|---|---|---|
| Standard | Geist | Geist Mono | Geist |
| Digital | Bebas Neue | IBM Plex Mono | DM Sans |
| Retro | Press Start 2P (sparingly) | VT323 | MS Sans Serif / Tahoma / Arial |

### Sound System
- `SoundManager.js` singleton in `src/sound/`
- Per-theme mute state: `fp-sound-muted-digital` (default: muted), `fp-sound-muted-retro` (default: unmuted)
- Digital pack: 13 synthesized sounds via Web Audio API (no audio files)
- Retro pack: 13 sounds including Win95-style boot chime
- Standard: silent (no sound pack)
- Available sounds: `click, hover, activate, select, terminalOpen, terminalClose, terminalKey, terminalSubmit, modalOpen, modalClose, success, error, toggle`

### Retro-Specific Features
- CRT scanline effect: toggled by `data-crt="on"` on `<html>`, persisted in `fp-retro-crt` localStorage
- Boot sequence: `RetroBootSequence.jsx` plays on every navigation to `/home` in Retro UI (mounted by RetroLanding, no longer gated by localStorage)
- Status bar at bottom with clock, CRT toggle, mute toggle, UI picker

### Page Variants Per Theme
Inner pages are thin theme switchers — the top-level page file checks `themeId` and renders the correct variant:
- Digital variants: `src/pages/digital/Digital[PageName].jsx`
- Standard variants: `src/components/standard/pages/Standard[PageName].jsx`
- Retro variants: currently renders Standard variants inside RetroLayout chrome (Phase 15b is planned but not built)

### Adding a New Theme
1. Create `src/themes/yourtheme/manifest.js`
2. Create `src/themes/yourtheme/tokens.css` (scope to `[data-ui="yourtheme"]`)
3. Create `src/themes/yourtheme/fonts.css` if needed
4. Register manifest in `src/themes/registry.js`
5. Import tokens.css and fonts.css in `src/main.jsx`

---

## 5. ROUTING STRUCTURE

All routes in `src/App.jsx`. All lazy-loaded. `PageLayout` adds theme-appropriate wrapper for inner pages.

### Entry Points
| Route | Component | Layout | Notes |
|---|---|---|---|
| `/` | `Landing.jsx` | none (self-contained) | Always Digital aesthetic; splash/entry |
| `/home` | `HomeRoute` → `StandardLanding` or `RetroLanding` | `StandardLayout` or `RetroLayout` | Standard/Retro landing |
| `/hub` | `Hub.jsx` | none (self-contained) | Digital only; 8-node hex nav |

### Inner Pages (wrapped by PageLayout)
| Route | Page File | Standard Component | Digital Component |
|---|---|---|---|
| `/about` | `About.jsx` | `StandardAbout` | `DigitalAbout` |
| `/portfolio` | `Portfolio.jsx` | `StandardPortfolio` | `DigitalPortfolio` |
| `/portfolio/:slug` | `ProjectPage.jsx` | `StandardProjectPage` | `DigitalProjectPage` |
| `/skills` | `Skills.jsx` | `StandardSkills` | `DigitalSkills` |
| `/services` | `Services.jsx` | `StandardServices` | `DigitalServices` |
| `/services/:category` | `Services.jsx` | same | same |
| `/lab` | `Lab.jsx` | `StandardLab` | `DigitalLab` |
| `/lab/beat-beaters` | `BeatBeatersSelect.jsx` | none (standalone) | Song select; entry point for the rhythm game |
| `/lab/beat-beaters/play` | `BeatBeaters.jsx` | none (standalone) | Game engine; requires `location.state.chartData` — redirects to select if missing |
| `/lab/beat-beaters/editor` | `BeatBeatersEditor.jsx` | none (standalone) | Chart creation tool |
| `/lab/:slug` | `LabExperiment.jsx` | `StandardLabExperiment` | `DigitalLabExperiment` |
| `/store` | `Store.jsx` | `StandardStore` | `DigitalStore` |
| `/media` | `Media.jsx` | `StandardMedia` | `DigitalMedia` |
| `/contact` | `Contact.jsx` | `StandardContact` | `DigitalContact` |
| `/admin` | `Admin.jsx` | none (standalone, no layout) | — |
| `*` | `NotFound.jsx` | wrapped by PageLayout | — |

### Pantheon Wars Routes (under `PantheonWarsShell` — provides `PantheonWarsContext`)
| Route | Component | Status |
|---|---|---|
| `/games/pantheon-wars` | `Dashboard.jsx` | Built ✅ |
| `/games/pantheon-wars/quests` | `Quests.jsx` | Built ✅ |
| `/games/pantheon-wars/signup` | `Signup.jsx` | Built ✅ |
| `/games/pantheon-wars/login` | `Login.jsx` | Built ✅ |
| `/games/pantheon-wars/inventory` | `Inventory.jsx` | Built ✅ |
| `/games/pantheon-wars/shop` | `Shop.jsx` | Built ✅ |
| `/games/pantheon-wars/temples` | `Temples.jsx` | Built ✅ (Phase 4) |
| `/games/pantheon-wars/pvp` | `PvP.jsx` | Stub ⚠️ |
| `/games/pantheon-wars/leaderboard` | `Leaderboard.jsx` | Built ✅ |
| `/games/pantheon-wars/profile` | `Profile.jsx` | Built ✅ |

### Special Behaviors
- `/lab/beat-beaters` and `/lab/beat-beaters/play` are defined **before** `/lab/:slug` in App.jsx — they take priority over the generic experiment slug matcher
- `/lab/beat-beaters/play` with no router state → redirects to `/lab/beat-beaters` (song select)
- `/lab/pantheon-wars` → `<Navigate replace />` to `/games/pantheon-wars` (in LabExperiment.jsx)
- `/admin` uses no layout wrapper (standalone page, auth-gated)
- Digital theme: `PageChrome` (HubReturnButton), `SoundToggle`, `Terminal` rendered globally in `AppInner`
- Terminal: backtick (`` ` ``) opens, Escape or backtick closes; commands: help, ls, ls projects, cd [route], whoami, clear, exit

---

## 6. DATABASE SCHEMA

### Connection
- Driver: `@neondatabase/serverless` (`neon()` from `lib/db.js`)
- Connection string resolution order: `POSTGRES_DATABASE_URL` → `POSTGRES_URL` → `POSTGRES_DATABASE_URL_UNPOOLED` → `POSTGRES_URL_NON_POOLING` → `DATABASE_URL` → `DATABASE_URL_UNPOOLED`
- Initialize: `npm run db:init` (safe to re-run)

### Infrastructure Tables

**`visitors`** — unique people across all sessions
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(64) PK | visitor UUID (localStorage) |
| `first_seen_at` | TIMESTAMPTZ | |
| `last_seen_at` | TIMESTAMPTZ | |
| `session_count` | INT | |
| `country` | VARCHAR(2) | |

**`sessions`** — lifecycle of a single visit
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(64) PK | session UUID (sessionStorage) |
| `visitor_id` | FK → visitors | |
| `started_at` | TIMESTAMPTZ | |
| `last_seen_at` | TIMESTAMPTZ | |
| `page_count` | INT | |
| `duration_seconds` | INT | |
| `country`, `region`, `city` | VARCHAR | geo from IP |
| `device_type`, `browser`, `os` | VARCHAR | from UA parser |
| `ui_theme`, `ui_mode` | VARCHAR | which theme/mode at session start |
| `referrer` | VARCHAR(500) | |
| `entry_path` | VARCHAR(255) | first page |

**`events`** — every tracked action
| Column | Type | Notes |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `event_type` | VARCHAR(64) | page_view, scroll_depth, time_on_page |
| `event_data` | JSONB | arbitrary payload |
| `session_id` | FK → sessions | |
| `visitor_id` | VARCHAR(64) | denormalized |
| `path` | VARCHAR(255) | |
| `ui_theme`, `ui_mode` | VARCHAR | |
| `timestamp` | TIMESTAMPTZ | |
Indexes: timestamp DESC, event_type, session_id, visitor_id, path

**`admin_sessions`** — admin auth cookies
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(128) PK | hex token |
| `created_at` | TIMESTAMPTZ | |
| `expires_at` | TIMESTAMPTZ | 7 days |
| `ip_address` | VARCHAR(45) | |
| `user_agent` | TEXT | |

### Pantheon Wars Tables (all prefixed `pw_`)

**`pw_users`** — game player accounts
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | gen_random_uuid() |
| `username` | VARCHAR(30) UNIQUE | |
| `email` | VARCHAR(255) UNIQUE | |
| `password_hash` | VARCHAR(255) | bcrypt 12 rounds |
| `faction` | VARCHAR(20) | olympians / aesir / annunaki |
| `class` | VARCHAR(20) | warden / oracle / slayer / broker |
| `alignment` | VARCHAR(20) | coalition / compact / NULL (unlocked at level 10) |
| `created_at`, `last_login` | TIMESTAMPTZ | |

**`pw_player_stats`** — 1:1 with pw_users
| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID PK FK → pw_users | |
| `level` | INT | default 1, max 100 |
| `xp` | INT | threshold = floor(100 * level^1.5) |
| `energy` | INT | default 20, regen 1/5min |
| `energy_max` | INT | default 20 |
| `health` | INT | default 100, regen 1/3min |
| `health_max` | INT | default 100 |
| `drachma` | INT | default 500, primary currency |
| `drachma_lifetime` | INT | for leaderboard (never decremented) |
| `glory` | INT | PvP-only currency |
| `attack` | INT | default 5 |
| `defense` | INT | default 5 |
| `stat_points` | INT | +5 per level-up, spent manually |
| `last_updated` | TIMESTAMPTZ | regen calculated from this |

**`pw_user_sessions`** — game player auth cookies
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | session ID in cookie |
| `user_id` | FK → pw_users | |
| `created_at` | TIMESTAMPTZ | |
| `expires_at` | TIMESTAMPTZ | 7 days |

**`pw_quests`** — quest catalog (seeded, 40 quests)
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `name` | VARCHAR(100) | |
| `description` | TEXT | |
| `tier` | INT | 1–5 |
| `energy_cost` | INT | |
| `xp_reward` | INT | |
| `drachma_base` | INT | |
| `drachma_range` | INT | random variance added |
| `loot_chance` | INT | 0–100 percentage |
| `level_required` | INT | default 1 |
| `mastery_target` | INT | default 100 (completions for mastery) |

**`pw_quest_progress`** — per-player quest completion tracking
| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID FK | composite PK with quest_id |
| `quest_id` | INT FK | |
| `completions` | INT | |

**`pw_items`** — equipment catalog (seeded, 50 items)
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `name` | VARCHAR(100) | |
| `description` | TEXT | |
| `slot` | VARCHAR(20) | weapon / armor / artifact / mount / companion |
| `attack_bonus`, `defense_bonus` | INT | |
| `rarity` | VARCHAR(20) | common / uncommon / rare / epic / legendary |
| `level_required` | INT | |
| `faction_exclusive` | VARCHAR(20) | NULL = any faction |
| `buy_price` | INT | NULL = not in drachma shop |
| `sell_price` | INT | |
| `glory_price` | INT | NULL = not in glory shop |

**`pw_inventory`** — player-owned items (many per player)
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `user_id` | FK → pw_users | |
| `item_id` | FK → pw_items | |
| `equipped` | BOOLEAN | one per slot enforced in app logic |
| `acquired_at` | TIMESTAMPTZ | |

**`pw_quest_loot`** — which items can drop from which quests (seeded, 120 mappings)
| Column | Type | Notes |
|---|---|---|
| `quest_id` | INT FK | composite PK with item_id |
| `item_id` | INT FK | |
| `drop_weight` | INT | weighted random selection |

**`pw_temples`** — temple catalog (seeded)
| Column | Type | Notes |
|---|---|---|
| `type` | VARCHAR(50) PK | e.g. "olympus_shrine" |
| `name` | VARCHAR(100) | |
| `base_cost` | INT | drachma to purchase |
| `income_per_hour` | INT | passive drachma rate |
| `level_required` | INT | |

**`pw_player_temples`** — player-owned temples
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `user_id` | FK → pw_users | |
| `temple_type` | FK → pw_temples.type | |
| `upgrade_level` | INT | 0–10, +25% income per level |
| `purchased_at` | TIMESTAMPTZ | |

---

## 7. API ENDPOINTS

**CRITICAL: Vercel Hobby = 12 function limit. 8 used. Add game logic as switch cases in game.js — NEVER create new API files.**

### Infrastructure APIs

**`api/contact.js`** — handles 3 form types via `type` field in POST body
- `type: 'contact'` — Contact page form
- `type: 'newsletter'` — Media page NewsletterStrip
- `type: 'intake'` — Services IntakeWizard
- Sends emails via Resend

**`api/track.js`** — event ingestion
- POST — accepts `{ events[] }` array, writes to visitors/sessions/events tables
- Respects Do-Not-Track header

**`api/auth/admin.js`** — admin login
- POST — verifies password against `ADMIN_PASSWORD_HASH`, creates session cookie `fp_admin`

**`api/auth/check.js`** — validate admin session
- GET — returns `{ ok: true }` or 401

**`api/auth/logout.js`** — admin logout
- POST — revokes session, clears `fp_admin` cookie

**`api/admin/overview.js`** — stats dashboard (admin-gated)
- GET — returns 30-day stats: session count, visitor count, page views, top paths, recent events, area chart data

### Game APIs (CONSOLIDATED — 2 files total)

**`api/games/pantheon-wars/auth.js`** — player auth, routed by `?action=`
| Action | Method | Auth Required | Description |
|---|---|---|---|
| `signup` | POST | no | Create account, init stats, set pw_session cookie |
| `login` | POST | no | Verify password, return user+stats, set pw_session cookie |
| `logout` | POST | no | Revoke session, clear cookie |
| `me` | GET | yes | Return current user + stats with regen applied |

**`api/games/pantheon-wars/game.js`** — all game actions, routed by `?action=`, all require `pw_session` auth
| Action | Method | Description |
|---|---|---|
| `quests` | GET | List quests available to player level, with completions |
| `complete` | POST | Complete a quest: spend energy, earn XP+drachma+loot, check level-up |
| `inventory` | GET | List player inventory with equipped state and equipment bonuses |
| `equip` | POST | Equip item by `inventory_id` (auto-unequips same-slot item) |
| `unequip` | POST | Unequip item by `inventory_id` |
| `sell` | POST | Delete inventory item, add sell_price to drachma |
| `shop` | GET | List purchasable items (drachma + glory tabs), player currency |
| `buy` | POST | Purchase item with drachma or glory |
| `leaderboard` | GET | Ranked list by `?type=level/glory/drachma/mastery` + `?faction=all/olympians/aesir/annunaki` |
| `allocate` | POST | Spend stat points into attack/defense |
| `temples` | GET | Catalog of available temples + owned temples + passive income total |
| `temples_buy` | POST | Purchase a temple type |
| `temples_upgrade` | POST | Upgrade an owned temple (max level 10, +25% income each) |

---

## 8. AUTH SYSTEMS (TWO SEPARATE, COMPLETELY INDEPENDENT)

### Admin Auth (`lib/auth.js`)
- **Who:** Single admin (Kyle only)
- **Cookie:** `fp_admin` — HttpOnly, Secure, SameSite=Strict, 7-day expiry
- **Password storage:** `ADMIN_PASSWORD_HASH` env var (bcrypt hash, 12 rounds)
- **Session storage:** `admin_sessions` DB table
- **Middleware:** `requireAdmin(req, res)` — call at top of protected endpoints, returns false + sends 401 if invalid
- **Generate hash:** `npm run gen:hash`

### Player Auth (`lib/pwAuth.js`)
- **Who:** Any game player (multi-user)
- **Cookie:** `pw_session` — HttpOnly, Secure, SameSite=Strict, 7-day expiry
- **Password storage:** `pw_users.password_hash` (bcrypt hash, 12 rounds)
- **Session storage:** `pw_user_sessions` DB table
- **Session ID format:** UUID (gen_random_uuid in DB)
- **Middleware:** `requireUser(handler)` — higher-order function wrapping the entire handler, sets `req.userId`
- **Anti-timing:** Login adds 800ms delay on wrong password to prevent timing attacks

### Key Difference
- Admin auth: checks a single env-var hash, stores session as hex string
- Player auth: full multi-user signup/login, sessions stored as UUIDs
- Never mix these systems — different cookies, different tables, different middleware

---

## 9. TRACKING SYSTEM

### Architecture
- `src/tracking/Tracker.js` — singleton, buffers events, flushes on `pagehide` or every 5 seconds
- `src/tracking/sessionUtils.js` — visitor ID (localStorage), session ID (sessionStorage)
- `src/tracking/useTracker.js` — React hook wrapping the singleton
- `src/tracking/AutoTrackers.jsx` — mounted globally in `AppInner`, auto-tracks 3 event types

### Auto-Tracked Events
| Event | Trigger |
|---|---|
| `page_view` | Route change (useLocation) |
| `scroll_depth` | Scroll milestones: 25%, 50%, 75%, 100% |
| `time_on_page` | pagehide + periodic flush |

### Important Notes
- `ua-parser-js` must be imported as `{ UAParser }` (named import) — `import UAParser from ...` breaks
- Events sent to `POST /api/track` with keepalive on pagehide
- Respects `navigator.doNotTrack`
- Admin dashboard at `/admin` shows: 4 stat cards, 30-day area chart, top paths, recent events

---

## 10. DATA FILES (`src/data/`)

| File | Contents | Used By |
|---|---|---|
| `projects.js` | 7 portfolio projects (slug, name, status, category, stack, metrics, thumbnail, images, hasDemo, demoUrl, liveUrl, cta, relatedSlugs) | Portfolio, ProjectPage, About, StandardLanding |
| `labExperiments.js` | 5 lab experiments incl. Pantheon Wars (external flag) | Lab, LabExperiment, StandardLanding |
| `skills.js` | Disciplines, tools (with IDs + parentId), specializations (3 tiers) | Skills, About, StandardAbout |
| `services.js` | 6 service categories with packages, prices, deliverables | Services, About, StandardLanding |
| `storeProducts.js` | Digital, software, physical products (id, type, name, price, purchaseUrl) | Store |
| `media.js` | YouTube video array (id = YouTube ID, tabId), tabs[], featuredVideoId, newsletterCopy | Media |
| `socialLinks.js` | Single source of truth for email, LinkedIn, GitHub, YouTube (@loudd + @LouddDocs) | About, Contact, Footer, nav |
| `cadModels.js` | 6 CAD models → `.glb` files in `public/3d_files/` | CADViewer lab experiment |
| `beatBeatersCharts.js` | Beat Beaters song registry — **add entries here to add songs** (id, title, artist, bpm, audioFile, chartFile, availableDifficulties[], accentColor) | BeatBeatersSelect |
| `siteStatus.js` | Current availability (OPEN), per-project status | About, Services |

### Social Links (actual values)
- Email: `kyle@freshprints.dev`
- GitHub: `https://github.com/loudpacck` (@loudpacck)
- LinkedIn: `https://www.linkedin.com/in/kyle-debord-976252186/` (@kyle-debord)
- YouTube Main: `https://www.youtube.com/@loudd` (@loudd)
- YouTube Docs: `https://www.youtube.com/@LouddDocs` (@LouddDocs)

---

## 11. PORTFOLIO PROJECTS

All in `src/data/projects.js`:

| Slug | Name | Status | Categories | Featured |
|---|---|---|---|---|
| `predictinator-5000` | Predictinator | ACTIVE | software, ai | yes |
| `plutus` | Plutus | BETA | software, ai | yes |
| `pantheon` | Pantheon | IN_DEVELOPMENT | games | yes |
| `jogger` | Jogger | IN_DEVELOPMENT | games, ai | no |
| `architect` | Architect (Archie) | BETA | ai, engineering | no |
| `hot-potato` | Hot Potato | ACTIVE | games | no |
| `fresh-prints-prototypes` | Fresh Prints - Production & Design | AVAILABLE | engineering | yes |

### Status Color Map
| Status | Color | Notes |
|---|---|---|
| ACTIVE / PRODUCTION | #22C55E green | |
| BETA | #F59E0B amber | |
| STABLE / PROFESSIONAL | #00C8FF cyan | |
| CONCEPT / RESEARCH | #8B5CF6 violet | |
| IN_DEVELOPMENT | #F59E0B amber | Display label uses `.replace(/_/g, ' ')` → "IN DEVELOPMENT" |
| AVAILABLE | #FFFFFF white | Box-shadow glow + border for visibility |

### Status Defined In (update all four when adding new statuses)
1. `src/components/ui/Badge.jsx` (Digital)
2. `src/components/standard/StandardCard.jsx`
3. `src/components/standard/pages/StandardPortfolio.jsx`
4. `src/components/standard/pages/StandardProjectPage.jsx`

---

## 12. PANTHEON WARS GAME

### Summary
Persistent multiplayer browser idle RPG at `/games/pantheon-wars`. Greek/Norse/Mesopotamian mythology theme. Mafia Wars clone: players spend energy on quests, earn XP + drachma, level up, buy equipment, own income-generating temples, and (eventually) attack other players. All progress is server-authoritative — no client-side game state persisted to DB without server validation.

### Build State
| Phase | Description | Status |
|---|---|---|
| Phase 1 — Auth + Foundation | Signup, login, session, player stats, faction/class | ✅ Complete |
| Phase 2 — Quests + Regen + Leveling | Quest board, energy cost, XP/drachma rewards, level-up | ✅ Complete |
| Phase B1 — Stat Allocation | Profile page, spend stat_points into attack/defense | ✅ Complete |
| Phase B2/B3 — Inventory + Shop + Leaderboard | Items, loot drops, equip/sell/buy, leaderboard | ✅ Complete |
| Phase 4 — Temples | Passive income properties, purchase + upgrade | ✅ Complete |
| Phase 5 — PvP | Combat, target list, combat log, glory | ❌ Not built |
| Phase 6 — Leaderboards + Polish | Leaderboards built ✅, remaining polish | Partial |

### Game Mechanics
- **Factions:** olympians (+5% XP), aesir (+5% attack), annunaki (+5% drachma)
- **Classes:** warden (defense), oracle (energy), slayer (attack), broker (+10% drachma)
- **Level-up formula:** XP threshold = floor(100 * level^1.5), +5 stat points per level
- **Energy regen:** 1 per 300s (5 min) — server-calculated on every API request, no cron jobs
- **Health regen:** 1 per 180s (3 min) — same approach
- **Temple income:** income_per_hour × (1 + 0.25 × upgrade_level) × hours_elapsed, calculated on request
- **One equipped item per slot** — enforced in app logic (equip auto-unequips same-slot), not DB constraint
- **Loot drops:** weighted random from `pw_quest_loot` table, chance from `quest.loot_chance`
- **Alignment:** chosen at level 10 (coalition or compact), enables PvP matchmaking (not yet built)

### Seed Data
- 50 items in `pw_items` (across 5 slots: weapon, armor, artifact, mount, companion)
- 40 quests in `pw_quests` (5 tiers)
- 120 quest-loot mappings in `pw_quest_loot`
- Temple types in `pw_temples` (seeded with `npm run db:seed:pw`)

### Key Technical Decisions
1. **API consolidated to 2 files** (`auth.js` + `game.js`) due to Vercel 12-function limit. New game features → new `if (action === 'x')` case in `game.js`, NOT a new file.
2. **No cron jobs** — all regen/income calculated on every request using `regenPlayer()` in `lib/pwHelpers.js`
3. **Driver:** `@neondatabase/serverless` with `POSTGRES_DATABASE_URL` env var
4. **Context:** `PantheonWarsContext` provided by `PantheonWarsShell` in `App.jsx` — wraps all game routes
5. **Namespace isolation:** All routes `/games/pantheon-wars/*`, all API `/api/games/pantheon-wars/*`, all DB tables `pw_*`

### `lib/pwHelpers.js` — Pure Game Logic Functions
- `regenPlayer(playerStats, ownedTemples = [])` — calculates energy + health regen + temple income since last_updated. Returns updated stats object. Caller must persist.
- `checkLevelUp(playerStats)` — handles multi-level XP thresholds, awards stat_points, restores energy/health on level-up. Returns updated stats object.

---

## 13. BEAT BEATERS — RHYTHM GAME

### Summary
9-lane keyboard rhythm game at `/lab/beat-beaters`. All 5 build phases complete. No open build debt. No new npm packages — uses browser Web Audio API only.

### Routes
| Route | Component | Purpose |
|---|---|---|
| `/lab/beat-beaters` | `BeatBeatersSelect.jsx` | Song select; fetches chart JSON on difficulty click |
| `/lab/beat-beaters/play` | `BeatBeaters.jsx` | Game engine; reads data from `location.state` |
| `/lab/beat-beaters/editor` | `BeatBeatersEditor.jsx` | Chart creation + export tool |

### Adding a Song (3 steps, no rebuild)
1. Drop MP3 → `public/audio/your-song.mp3`
2. Drop chart JSON → `public/charts/your-song.json`
3. Add one entry to `src/data/beatBeatersCharts.js`

Chart files are `fetch()`'d at runtime. Vercel serves them as static files with no server code involved.

### Lane Layout
```
Lanes:  W(0)  A(1)  S(2)  D(3)  |  Space(4)  |  I(5)  J(6)  K(7)  L(8)
Colors: #FF3B3B #FF9F0A #30D158 #0A84FF  #FFFFFF  #BF5AF2 #FF375F #64D2FF #FFD60A
```
6px cluster gap between D/Space and Space/I.

### Chart JSON Schema (`public/charts/*.json`)
```json
{
  "title": "string",
  "artist": "string",
  "bpm": 120,
  "audioFile": "filename.mp3",
  "difficulties": {
    "easy": {
      "noteSpeed": 4.0,
      "notes": [{ "lane": 0-8, "time": 1.5, "duration": 0, "type": "tap|hold" }]
    }
  }
}
```
`noteSpeed` × 80 = scroll speed px/sec. `duration` = 0 for tap, seconds for hold.

### Song Registry Schema (`src/data/beatBeatersCharts.js`)
```js
{
  id, title, artist, bpm,
  audioFile,              // relative to public/audio/
  chartFile,              // relative to public/charts/
  availableDifficulties,  // ['easy'] | ['easy','medium','hard']
  accentColor,            // hex — used for card border and difficulty glow
}
```

### Game Architecture
- **State flow:** `BeatBeatersSelect` fetches chart → `navigate('/lab/beat-beaters/play', { state: { chartData, difficulty, audioFile, songTitle, songArtist } })`
- **Guard:** `BeatBeaters` redirects to `/lab/beat-beaters` if `location.state.chartData` is null (direct URL visit)
- **Notes**: loaded via `useMemo` from `chartData.difficulties[difficulty].notes`. Refs (`chartNotesRef`, `scrollSpeedRef`) make dynamic values available inside the RAF loop without re-creating the effect.
- **Audio**: `AudioContext` + `AnalyserNode` created on first START click (user gesture required). Graceful fallback to sine-wave demo visualizer when audio file is missing.
- **Timing**: `audio.currentTime` used for sample-accurate note sync when audio is loaded; falls back to `performance.now()`.

### Scoring System
| Judgment | Window | Base Points |
|---|---|---|
| PERFECT | ±30ms | 300 |
| GOOD | ±80ms | 150 |
| LATE/EARLY | ±150ms | 50 |
| MISS | past 150ms | 0, breaks combo |

Combo multiplier: 1× (0–9), 2× (10–19), 3× (20–29), 4× (30+)
Beat Meter: fills 10% per PERFECT. Shift at 50%+ activates 8s × 2 score multiplier.

### Build Phases
| Phase | What Was Built |
|---|---|
| Phase 1 | 9-lane canvas, note scrolling, input detection, hit detection, hold notes |
| Phase 2 | Web Audio API, AudioContext/AnalyserNode, audio-reactive visualizer |
| Phase 3 | Full scoring, combo multiplier, Beat Meter, end screen with grade |
| Phase 4 | Chart editor (BeatBeatersEditor.jsx) — record, timeline, quantize, export |
| Phase 5 | Song select screen, dynamic chart loading, router-state flow |

### Public Asset Directories
- `public/audio/` — MP3 audio files (referenced by `audioFile` in chart JSON and song registry)
- `public/charts/` — Chart JSON files (referenced by `chartFile` in song registry)
- Both have README.txt files with instructions

---

## 14. KNOWN ISSUES / TECHNICAL DEBT

- **`react-three-fiber` chunk is ~868KB** — pre-existing, non-critical, not blocking. Hub background 3D scene loads this.
- **CAD model descriptions** — all 6 models in `cadModels.js` have `description: 'Description coming soon.'`
- **`cadModels.js` relatedProjectSlug** — all 6 models have `relatedProjectSlug: null` (not linked to portfolio projects)
- **UA Parser import** — must use `{ UAParser }` named import (v2 breaking change). Default import `UAParser` throws at runtime. Previously broke tracking; fixed.
- **`siteStatus.js` lastUpdated** — set to `'2026-05-07'`, may need updating.
- **PvP route** — `src/pages/games/pantheon-wars/PvP.jsx` is a stub. Dashboard shows it as disabled (`comingSoon: true`).
- **Profile photo in About** — may still show a placeholder in some UI variants.
- **Standard tokens** include Digital-name aliases as a bridge — these are intentional but create a dual naming convention.
- **Retro inner pages** — Retro theme currently renders Standard page variants inside RetroLayout. Phase 15b (dedicated Retro inner pages) was planned but not built.
- **`src/styles/tokens.css`** — stub comment only. All real tokens are in `src/themes/digital/tokens.css`. Don't add tokens to the stub.

---

## 15. DEVELOPMENT RULES (READ BEFORE DOING ANYTHING)

1. **PowerShell commands only:** `ls`, `cd`, `mkdir`, `cat`, `npm`, `npx` — no `Get-ChildItem`, no PS flags
2. **One npm install per command** — never `npm install pkg1 pkg2`
3. **No command chaining** — no `&&`, no `;` between separate commands
4. **No verification between steps** — verify once at end with `vercel dev`
5. **API routes require `vercel dev`** — `npm run dev` won't serve `/api/*`
6. **New game endpoints → `game.js` switch case** — NEVER create new API files (Vercel function limit)
7. **Standard is default** — Digital is opt-in via `?ui=digital`
8. **All game DB tables prefixed `pw_`** — never create bare game tables
9. **Admin cookie: `fp_admin`** | **Player cookie: `pw_session`** — completely separate systems
10. **`npm run db:init` is safe to re-run** — all `CREATE TABLE IF NOT EXISTS`
11. **`npm run db:seed:pw` is safe to re-run** — all `ON CONFLICT DO NOTHING`
12. **Vercel function limit: 12 max, 8 used** — 4 slots remain
13. **Token source of truth: each theme's own `tokens.css`** — never hardcode colors/spacing inline
14. **Category color map (tags, cards):** software → #00C8FF, games → #FFB347, engineering → #A0A0B8, ai → #8B5CF6, content → #FBBF24
15. **Design tokens for everything** — never hardcode hex values except in token definition files
16. **All animations respect `prefers-reduced-motion`** via `useReducedMotion` hook
17. **Data is local** — `src/data/` is the source of truth, no CMS/API fetching

---

## 16. ENVIRONMENT VARIABLES

All must be set in `.env.local` for local dev AND in Vercel dashboard for production.

| Var Name | What It's For |
|---|---|
| `POSTGRES_DATABASE_URL` | Neon serverless connection string (primary — auto-set by Vercel/Neon integration) |
| `POSTGRES_URL` | Neon alternate connection string (fallback in lib/db.js) |
| `POSTGRES_DATABASE_URL_UNPOOLED` | Neon direct (unpooled) connection string (fallback) |
| `POSTGRES_URL_NON_POOLING` | Neon alternate unpooled (fallback) |
| `DATABASE_URL` | Generic fallback |
| `DATABASE_URL_UNPOOLED` | Generic unpooled fallback |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password. Generate: `npm run gen:hash` |
| `RESEND_API_KEY` | Resend email service API key |
| `CONTACT_TO_EMAIL` | Receiving email for contact form submissions (Kyle's email) |
| `CONTACT_FROM_EMAIL` | Verified sender in Resend (e.g. `noreply@freshprints.dev`) |

---

## 17. FILE STRUCTURE OVERVIEW

```
B:\freshprints-dev\
│
├── api/                          Vercel serverless functions
│   ├── contact.js                Contact/newsletter/intake emails
│   ├── track.js                  Analytics event ingestion
│   ├── auth/
│   │   ├── admin.js              Admin login
│   │   ├── check.js              Admin session validation
│   │   └── logout.js             Admin session revocation
│   ├── admin/
│   │   └── overview.js           Admin dashboard stats
│   └── games/pantheon-wars/
│       ├── auth.js               Player signup/login/logout/me
│       └── game.js               All game actions (quests, inventory, shop, temples, etc.)
│
├── db/
│   └── schema.sql                Full DB schema (run via npm run db:init)
│
├── docs/
│   └── PROJECT_REFERENCE.md      This file
│
├── lib/                          Shared backend utilities
│   ├── auth.js                   Admin auth helpers (fp_admin cookie)
│   ├── db.js                     Neon DB client export
│   ├── pwAuth.js                 Player auth helpers (pw_session cookie)
│   └── pwHelpers.js              Pure game logic (regenPlayer, checkLevelUp)
│
├── pantheon_wars/
│   └── docs/
│       └── PANTHEON-WARS-GDD.md  Full game design document
│
├── public/
│   ├── 3d_files/                 CAD .glb models (6 files)
│   ├── audio/                    MP3 audio files for Beat Beaters (test.mp3 = demo)
│   ├── charts/                   Chart JSON files for Beat Beaters (demo.json = demo)
│   ├── thumbnails/               Project card thumbnails
│   ├── images/                   Project gallery images
│   └── og-image.svg              Open Graph image
│
├── scripts/                      One-off Node scripts (not Vercel functions)
│   ├── init-db.js                Runs schema.sql
│   ├── seed-pantheon-wars.js     Seeds game items/quests/temples
│   └── gen-admin-hash.js         bcrypt hash generator
│
├── src/
│   ├── App.jsx                   Root: ThemeProvider, BrowserRouter, all routes
│   ├── main.jsx                  Vite entry: imports themes, registers sound packs
│   │
│   ├── components/
│   │   ├── about/                AboutStatus, AboutStory, AboutCapabilities, AboutStack, AboutConnect
│   │   ├── admin/                AdminLoginModal, AdminOverview
│   │   ├── contact/              ContactForm, ContactDirect
│   │   ├── dev/                  DevThemeSwitcher (Ctrl+Shift+T, dev-only)
│   │   ├── effects/              ParticleField (reusable animated particles)
│   │   ├── hub/                  HubSystemControls, UIPicker (Digital variant)
│   │   ├── lab/                  ExperimentCard; experiments/ subfolder
│   │   ├── layout/               PageChrome (HubReturnButton), SoundToggle, Footer
│   │   ├── media/                FeaturedVideo, VideoGrid, VideoCard, VideoLightbox, SeriesFilterTabs, NewsletterStrip
│   │   ├── portfolio/            ProjectCard, FeaturedStrip, FilterBar, ProjectGrid, ProjectHero, MetricsBar, VisualGallery, ModelViewer, RelatedProjects
│   │   ├── retro/                RetroLayout, RetroToolbar, RetroStatusBar, RetroButton, RetroCard, RetroBootSequence
│   │   ├── services/             AvailabilityIndicator, DecisionTree, PackageCard, ServiceCategoryTabs, ServiceCategoryBlock, ProcessSection, IntakeWizard; intake/ subfolder
│   │   ├── skills/               SkillMatrix, SkillNode, SkillDetail
│   │   ├── standard/             StandardLayout, StandardNav, StandardFooter, StandardButton, StandardCard, StandardReveal, StandardSectionHeader, StandardPillFilter; pages/ subfolder
│   │   ├── store/                ProductCard, ProductGrid, StoreFeaturedStrip, ProductDetailModal
│   │   ├── terminal/             Terminal (backtick toggle)
│   │   └── ui/                   Button, Badge, Tag, Card, LoadingDot, UIPicker (Standard variant)
│   │
│   ├── contexts/
│   │   └── PantheonWarsContext.jsx
│   │
│   ├── data/                     All local data (projects, skills, services, media, etc.)
│   │   └── beatBeatersCharts.js  Beat Beaters song registry — ADD SONGS HERE
│   ├── hooks/                    useTerminal, useReducedMotion, useTheme (re-export)
│   │
│   ├── pages/
│   │   ├── Landing.jsx           Digital-always splash page (/)
│   │   ├── Hub.jsx               Digital navigation center (/hub)
│   │   ├── StandardLanding.jsx   Standard home (/home)
│   │   ├── RetroLanding.jsx      Retro home (/home when retro)
│   │   ├── BeatBeatersSelect.jsx Song select screen (/lab/beat-beaters)
│   │   ├── BeatBeaters.jsx       Game engine (/lab/beat-beaters/play)
│   │   ├── BeatBeatersEditor.jsx Chart editor (/lab/beat-beaters/editor)
│   │   ├── Admin.jsx             Admin dashboard (/admin)
│   │   ├── NotFound.jsx          404
│   │   ├── [PageName].jsx        Thin theme switchers for all inner pages
│   │   ├── digital/              Digital-specific page implementations
│   │   └── games/pantheon-wars/  All game page components
│   │
│   ├── sound/
│   │   ├── SoundManager.js       Singleton, AudioContext, pack registry
│   │   ├── useSound.js           React hook
│   │   └── packs/
│   │       ├── digital.js        13 synthesized sounds
│   │       └── retro.js          13 retro sounds + aliases
│   │
│   ├── styles/
│   │   ├── global.css            Global resets, overflow-x: hidden on html+body, blueprint grid (light mode)
│   │   ├── animations.css        Shared keyframe animations
│   │   └── tokens.css            STUB ONLY — do not add tokens here
│   │
│   ├── themes/
│   │   ├── ThemeProvider.jsx     Context: themeId, mode, manifest, setTheme, setMode, toggleMode
│   │   ├── useTheme.js           Re-export for clean imports
│   │   ├── registry.js           Theme manifest registry
│   │   ├── digital/              manifest.js, tokens.css
│   │   ├── standard/             manifest.js, tokens.css, fonts.css
│   │   ├── retro/                manifest.js, tokens.css, fonts.css
│   │   ├── pantheon/             manifest.js (stub)
│   │   └── funky/                manifest.js (stub, hidden)
│   │
│   ├── tracking/                 Tracker.js, sessionUtils.js, useTracker.js, AutoTrackers.jsx
│   └── utils/                    categoryAssets.js (getCategoryColor, getCategoryIcon)
│
├── index.html                    Vite entry; Geist fonts; Google model-viewer CDN; flash prevention script; Plausible analytics
├── vite.config.js                @vitejs/plugin-react, @tailwindcss/vite, path alias @→/src
├── vercel.json                   SPA rewrite + security headers
└── package.json                  All dependencies
```

---

## 18. COMPONENT QUICK-REFERENCE

### Digital-Specific Components
- `Hub.jsx` — 8-node hex grid, 3-2-3 layout, keyboard nav, mobile radial drawer, terminal trigger
- `HubSystemControls.jsx` — bottom cluster: ADMIN | SOUND | CHANGE UI
- `Terminal.jsx` — backtick toggle, command interpreter
- `PageChrome.jsx` — HubReturnButton on all non-home routes (Digital only)
- `SoundToggle.jsx` — bottom-right fixed button (Digital only)

### Standard-Specific Components
- `StandardLayout.jsx` — nav + main + footer wrapper
- `StandardNav.jsx` — sticky blur nav, hamburger mobile
- `StandardFooter.jsx` — 3-col, "Switch to Operations Terminal" opens UIPicker
- `StandardButton.jsx` — primary/secondary/ghost variants
- `StandardCard.jsx` — image + status badge + hover-lift
- `StandardReveal.jsx` — scroll-reveal animation wrapper
- `StandardSectionHeader.jsx` — eyebrow + heading + subtitle
- `StandardPillFilter.jsx` — filter pill bar (Portfolio, Store, Media)

### Retro-Specific Components
- `RetroLayout.jsx` — toolbar + main + status bar
- `RetroToolbar.jsx` — title bar + menu bar, hamburger < 768px
- `RetroStatusBar.jsx` — sticky bottom: READY | path | CRT toggle | mute | UI picker | clock
- `RetroButton.jsx` — beveled Win95-style button
- `RetroCard.jsx` — beveled panel with optional title bar
- `RetroBootSequence.jsx` — BIOS + splash sequence (replays on every /home mount in Retro)

### Shared UI Components
- `UIPicker.jsx` — theme switcher modal (Standard: `src/components/ui/`, Digital/Hub: `src/components/hub/`)
- `Badge.jsx` — status badge with color map
- `Button.jsx` — Digital design system button
- `IntakeWizard.jsx` — 5-step service inquiry modal (used in Services + About)
- `ParticleField.jsx` — animated particle background (Landing + Portfolio Digital)

---

## 19. PLAUSIBLE ANALYTICS

- Account at plausible.io, site: freshprints.dev
- Script tag already in `index.html`
- Free tier, no cookies, GDPR-compliant
- Runs alongside custom tracking system (both active)

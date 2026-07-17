# Phase D — Design Report (Read-Only Recon)

> **Design pass only — nothing implemented.** Generated 2026-07-08 from a read-only pass over
> the live code. Part 1 designs the admin-auth serverless consolidation (D1); Part 2 designs
> the Pantheon Wars daily metrics rollup (D2). Each part ends with the Decision Points Kyle
> must sign off on before any implementation.
>
> Evidence basis: `api/auth/admin.js`, `api/auth/check.js`, `api/auth/logout.js`, `lib/auth.js`,
> `vercel.json`, full-repo caller grep, `api/admin/overview.js`,
> `api/games/pantheon-wars/game.js` (handleAdminMetrics, lines 4366–4430),
> `api/games/pantheon-wars/titan-cron.js`, `db/schema.sql` + migrations,
> `src/components/admin/GameMetrics.jsx` / `AdminOverview.jsx`.

---

# PART 1 — D1: Auth Consolidation

## 1.1 Current Endpoint Behavior (exact, per file)

All three files share: `export const config = { runtime: 'nodejs' }`, no try/catch around DB
calls (a thrown DB error surfaces as Vercel's generic 500 `FUNCTION_INVOCATION_FAILED`), and
every helper they call lives in `lib/auth.js`.

### `api/auth/admin.js` — login (21 lines)

| Aspect | Behavior |
|---|---|
| Methods | POST only. Any other method → **405** `{ error: 'Method not allowed' }` |
| Request | JSON body `{ password }`. Missing/empty → **400** `{ error: 'Missing password' }` |
| Password check | `verifyAdminPassword()` → `bcrypt.compare` vs `ADMIN_PASSWORD_HASH` env. Missing env var → treated as wrong password |
| Wrong password | **800 ms artificial delay** (`setTimeout`) then **401** `{ error: 'Invalid credentials' }` — anti-timing / brute-force damper. Must be preserved exactly |
| Success | `createAdminSession(req)`: 32-byte hex token via `randomBytes`, `expires_at = NOW + 7 days`, IP = first segment of `x-forwarded-for`, UA header; **INSERT** into `admin_sessions`. Then `Set-Cookie: fp_admin=<id>; Expires=<UTC>; HttpOnly; Secure; SameSite=Strict; Path=/` → **200** `{ ok: true }` |
| DB | 1 write (INSERT admin_sessions) on success; 0 on failure |

### `api/auth/check.js` — session validation (9 lines)

| Aspect | Behavior |
|---|---|
| Methods | **No method enforcement** — GET, POST, anything is accepted |
| Request | No body/params. Reads `fp_admin` from the Cookie header (`getSessionFromCookie` → `parseCookies`) |
| Response | **Always 200** `{ authenticated: true|false }`. It never returns 401. (Note: `docs/PROJECT_REFERENCE.md` §7 claims "returns `{ok:true}` or 401" — that is wrong; the merge should preserve the *actual* always-200 contract, since `Admin.jsx` reads `data.authenticated`.) |
| DB | 1 read: `SELECT id FROM admin_sessions WHERE id = $1 AND expires_at > NOW()`. Null cookie short-circuits to `false` with **no query** |
| Cookies | Read only — never sets or clears |

### `api/auth/logout.js` — session revocation (11 lines)

| Aspect | Behavior |
|---|---|
| Methods | POST only. Other methods → **405** `{ error: 'Method not allowed' }` |
| Request | No body. Reads `fp_admin` cookie |
| Behavior | `revokeAdminSession(sessionId)` → `DELETE FROM admin_sessions WHERE id = $1` (no-op if cookie absent — the helper early-returns on null). Then unconditionally sets clear-cookie `fp_admin=; Max-Age=0; HttpOnly; Secure; SameSite=Strict; Path=/` → **200** `{ ok: true }` |
| Auth | Deliberately requires no valid session — clearing a dead cookie must still succeed |
| DB | 0–1 writes (DELETE) |

## 1.2 Complete Caller Inventory

Grep coverage: whole repo for `/api/auth/(admin|check|logout)` and the looser `auth/(admin|check|logout)`
(string literals, template strings, helpers). **There are no helper wrappers — all calls are direct
`fetch()` string literals.** Exactly three code call sites exist:

| # | File : line | Call | Context |
|---|---|---|---|
| 1 | `src/components/admin/AdminLoginModal.jsx:51` | `fetch('/api/auth/admin', { method: 'POST', body: JSON.stringify({ password }) })` | Hub ADMIN button modal. On `res.ok` → `navigate('/admin')`; non-ok → "// ACCESS DENIED"; network throw → "// CONNECTION ERROR" |
| 2 | `src/pages/Admin.jsx:293` | `fetch('/api/auth/check').then(r => r.json()).catch(() => ({ authenticated: false }))` | Mount-time auth gate, raced in `Promise.all` with the moderator check. Reads `.authenticated` |
| 3 | `src/pages/Admin.jsx:311` | `fetch('/api/auth/logout', { method: 'POST' })` | `handleLogout()` when `authType === 'admin'`, then `navigate('/')` |

Non-code references (docs only — update, not migrate):

- `CLAUDE.md:475–477` — Phase 11 endpoint list
- `docs/PROJECT_REFERENCE.md` — §7 endpoint list + function inventory (line 457), §17 file tree (lines 831–833)
- `docs/AUDIT-2026-07.md` — historical audit record; leave as-is
- `gdd-recon.md:1230` — recon scratch doc; leave as-is

Nothing in `scripts/`, `api/` (cross-calls), `public/`, or config files hits these URLs.

## 1.3 `lib/auth.js` Interplay

`lib/auth.js` is a pure helper module — it defines no routes. Its consumers today:

| Import | Used by |
|---|---|
| `verifyAdminPassword`, `createAdminSession`, `buildSessionCookie` | `api/auth/admin.js` only |
| `getSessionFromCookie`, `validateAdminSession` | `api/auth/check.js` |
| `getSessionFromCookie`, `revokeAdminSession`, `buildClearSessionCookie` | `api/auth/logout.js` |
| `requireAdmin` | `api/auth/moderator.js`, `api/admin/overview.js`, `api/games/pantheon-wars/game.js`, `api/games/pantheon-wars/titan-cron.js` |

The merge touches **zero lines of `lib/auth.js`** — the same seven exported functions get called
from one handler file instead of three. `requireAdmin` consumers are unaffected. Note that all
three endpoints already transitively load `bcryptjs` (it's imported at the top of `lib/auth.js`),
so merging changes nothing about per-function dependency weight.

## 1.4 `vercel.json` / Middleware Check

- **Rewrites:** single SPA catch-all `/(.*) → /index.html`. On Vercel, existing functions win
  over rewrites, so `/api/auth/*` is unaffected today. Post-merge relevance: requests to the
  *deleted* paths will fall through to the rewrite and return `index.html` with 200 (see §1.6).
- **Headers:** the three security headers apply to `/(.*)` globally — nothing auth-path-specific.
- **Crons:** both target titan-cron; unrelated.
- **No `middleware.js`/`middleware.ts`, no `vercel.ts`** exists in the repo.

## 1.5 Proposed Merged Design

**File:** keep `api/auth/admin.js` as the surviving file (preserves the login URL — the most
security-sensitive endpoint keeps its address), routed by `?action=`, matching the established
`moderator.js` / `reset.js` pattern. Delete `api/auth/check.js` and `api/auth/logout.js`.

### Routing table

| Action | URL | Method | Behavior (identical-contract guarantee) |
|---|---|---|---|
| `login` | `POST /api/auth/admin?action=login` | POST only → 405 otherwise | Byte-identical to current login: 400 missing password, 800 ms delay + 401 wrong password, session INSERT + Set-Cookie + 200 `{ok:true}` |
| `check` | `GET /api/auth/admin?action=check` | See Decision D1-3 (current file enforces nothing) | Always 200 `{ authenticated: bool }`, no cookie writes, null-cookie short-circuit |
| `logout` | `POST /api/auth/admin?action=logout` | POST only → 405 otherwise | DELETE session (no-op on missing cookie), clear-cookie, 200 `{ok:true}` |
| *(none / unknown)* | — | — | **Transition default:** a bare `POST /api/auth/admin` (no action) falls through to `login` — this makes the merged handler a drop-in for the current login URL. Unknown non-empty action → 400 `{ error: 'Unknown action' }` |

Handler skeleton (design, not implementation):

```js
export default async function handler(req, res) {
  const action = req.query.action || (req.method === 'POST' ? 'login' : null)
  if (action === 'login')  return handleLogin(req, res)   // body of current admin.js
  if (action === 'check')  return handleCheck(req, res)   // body of current check.js
  if (action === 'logout') return handleLogout(req, res)  // body of current logout.js
  return res.status(400).json({ error: 'Unknown action' })
}
```

Each `handleX` is the existing file's handler body moved verbatim — no logic edits, no
`lib/auth.js` edits, no new response shapes.

### Frontend call-site updates (old → new)

| File : line | Old | New |
|---|---|---|
| `AdminLoginModal.jsx:51` | `POST /api/auth/admin` | `POST /api/auth/admin?action=login` (works either way given the bare-POST default; update for explicitness) |
| `Admin.jsx:293` | `GET /api/auth/check` | `GET /api/auth/admin?action=check` |
| `Admin.jsx:311` | `POST /api/auth/logout` | `POST /api/auth/admin?action=logout` |

Plus doc updates in the same commit: `CLAUDE.md` Phase 11 endpoint list, `PROJECT_REFERENCE.md`
§7/§17 + function-count lines (18, 102, 457, 789).

## 1.6 Deployment Safety Plan

**Atomic single-commit swap.** One commit containing: (a) merged `api/auth/admin.js`,
(b) deletion of `check.js` + `logout.js`, (c) the three frontend call-site edits, (d) doc updates.
Vercel deploys the whole commit as one immutable deployment — there is no window where the new
frontend can hit a deleted endpoint or the old frontend is paired with missing functions *within
a deployment*.

**In-flight admin session during the deploy:** unaffected. Sessions live in the `admin_sessions`
table keyed by the `fp_admin` cookie; neither the table, the cookie name, nor the validation
query changes. Kyle stays logged in across the deploy.

**Stale-tab edge (old bundle in an already-open browser tab):** an `/admin` tab loaded pre-deploy
still calls the old URLs. Deleted function paths fall through to the SPA rewrite and return
`index.html` with 200 → `r.json()` throws → `Admin.jsx`'s `.catch(() => ({ authenticated: false }))`
kicks in → redirect to `/`. A refresh loads the new bundle and auth works again. Logout from a
stale tab would silently not clear the cookie server-side until refresh. Degradation is graceful
and self-heals on reload; acceptable for a single-admin surface.

**Pre-push verification:** run `vercel dev` locally and exercise the full cycle against the merged
file — `login` (wrong password → 401 after delay; right password → cookie set), `check` (200
`authenticated:true`), `logout` (cookie cleared, subsequent check false), bare `POST /api/auth/admin`
(still logs in). Only push after all five pass.

**Recovery path if login breaks in production:** `git revert <commit>` + push — restores all three
files and the old frontend in one deployment (~1 min build). The `admin_sessions` table is never
touched by the swap, so any session created before the break remains valid after the revert.
Worst case is temporary loss of the admin dashboard (Kyle-only); zero visitor-facing surface is
involved.

## 1.7 Post-Merge Function Count

| | Count |
|---|---|
| Before | **11 / 12**: contact, track, auth/admin, auth/check, auth/logout, auth/moderator, auth/reset, admin/overview, pw/auth, pw/game, pw/titan-cron |
| After | **9 / 12**: contact, track, auth/admin (merged), auth/moderator, auth/reset, admin/overview, pw/auth, pw/game, pw/titan-cron |
| Slots freed | **2** → 3 open; with the project's "last slot permanently reserved" rule, **2 usable** |

## 1.8 Reasons NOT to Do This (honest flags)

- **Cold start / bundle weight: no downside found.** All three files already import `lib/auth.js`,
  which imports `bcryptjs` — the merged function's dependency graph equals today's login function.
  Merging arguably *helps*: the frequently-polled `check` keeps the shared instance warm for `login`.
- **Path-based security behavior: none exists** to lose (no per-path headers, no middleware, no WAF
  rules keyed to `/api/auth/check` or `/logout`).
- **Rate limiting:** none exists today on any of the three; the 800 ms wrong-password delay is
  in-handler and survives verbatim. Nothing changes.
- **Genuine (small) trade-offs:** one file now mixes an unauthenticated credential-accepting action
  with benign session actions — a routing bug could theoretically cross-wire them, which is why the
  three handler bodies should be moved verbatim into separate named functions rather than
  interleaved. And the bare-POST→login default keeps a permanent ambiguity if never tightened
  (Decision D1-2). Neither outweighs reclaiming 2 of 12 slots on a plan that is at 11.

## 1.9 D1 Decision Points (Kyle sign-off needed)

1. **Merged file path** — keep `api/auth/admin.js` as the survivor (recommended: login URL
   unchanged, drop-in default), or rename to something like `api/auth/session.js` (cleaner name,
   but all three URLs change and the bare-POST fallback loses its purpose)?
2. **Bare `POST /api/auth/admin` → login default** — keep permanently (maximum compatibility),
   or keep for one deploy then require explicit `?action=login` in a follow-up tightening?
3. **Method enforcement on `check`** — preserve the current accept-any-method behavior
   (strictly identical), or enforce GET-only (harmless tightening; `Admin.jsx` already uses GET)?
4. **Docs in the same commit** — update CLAUDE.md + PROJECT_REFERENCE.md function counts and
   endpoint lists atomically with the code (recommended), or as a follow-up?
5. **The 2 reclaimed slots** — leave unallocated, or earmark one now (e.g., a future dedicated
   rollup/cron endpoint) so they don't get spent by accident?

---

# PART 2 — D2: PW Metrics Daily Rollup

## 2.1 Current Metric Inventory

Two sources feed the dashboard, both polled every 30 s per open tab (paused when hidden, Phase C):

**A. `api/admin/overview.js` (site side, 11 queries)** — page views today/total, visitors,
sessions, recent events, top paths, two 30-day daily charts, device/browser/referrer breakdowns.
Site-side rollup is out of D2 scope (game metrics only) but the same table pattern extends to it
later.

**B. `admin_metrics` — `handleAdminMetrics` in `api/games/pantheon-wars/game.js:4366`
(14 parallel queries)**, consumed by `AdminOverview.jsx` and `GameMetrics.jsx`:

| # | Metric | Query shape | Now vs time-series | Cost |
|---|---|---|---|---|
| 1 | `totalPlayers` | `COUNT(*) pw_users` | Now; **historically derivable** from `created_at` | Small scan |
| 2 | `newPlayersToday` | `COUNT pw_users WHERE created_at > NOW()-24h` | Windowed; **derivable** | Scan (no created_at index; table small) |
| 3 | `activePlayers24h` | `COUNT DISTINCT user_id pw_player_stats WHERE last_updated > NOW()-24h` | Now-only; **IRRECOVERABLE** (last_updated is constantly overwritten by regen; also overcounts — see audit §6) | Full scan |
| 4 | `levelDistribution` | `GROUP BY level pw_player_stats` | Now; **IRRECOVERABLE** historically | Full scan |
| 5 | `factionDistribution` | `GROUP BY faction pw_users` | Now; semi-derivable (faction immutable at signup → reconstructible via `created_at`) | Scan |
| 6 | `classDistribution` | `GROUP BY class pw_users` | Same as 5 | Scan |
| 7 | `totalDrachma` / `avgDrachma` | `SUM/AVG(drachma) pw_player_stats` | Now; **IRRECOVERABLE** — supply today can never be reconstructed later | Full scan |
| 8 | `topRichest` | `ORDER BY drachma DESC LIMIT 10` + JOIN | Now; low historical value | Scan+sort (no `drachma` index — only `drachma_lifetime`) |
| 9 | `pvpFightsToday` | `COUNT pw_combat_log WHERE created_at > NOW()-24h` | **Derivable** from `created_at` | Scan — existing indexes lead with attacker/defender id, so a time-only filter can't use them |
| 10 | `pvpFightsTotal` | `COUNT(*) pw_combat_log` | **Derivable**; grows unbounded | Full scan, forever-growing |
| 11 | `questCompletionsTotal` | `SUM(completions) pw_quest_progress` | Running total, **no timestamps → per-day rate IRRECOVERABLE** without snapshots | Full scan |
| 12 | `titanEvents` | `GROUP BY status pw_titan_events` | Now; event rows persist | Small |
| 13 | `chatMessagesToday` | `COUNT pw_chat_messages 24h AND deleted_at IS NULL` | **Derivable** from `created_at` (index leads with channel, not time) | Scan |
| 14 | `activeModerations` | `COUNT pw_chat_moderations` active | Now; small | Trivial |

**Gap worth noting:** total **glory** supply is not measured anywhere today, and neither is
`drachma_lifetime` supply (total drachma ever minted — the inflation numerator). Both are
irrecoverable state and effectively free to add to the snapshot.

## 2.2 Irrecoverable vs Derivable — Priority

**(a) Irrecoverable — snapshot or lose forever (priority):**
- Total / average / median **drachma supply** (#7) and **glory supply** (new)
- **`drachma_lifetime` sum** (total ever minted — enables a true inflation-vs-sink chart)
- **Level distribution** (#4)
- **Quest completions running total** (#11 — diffing consecutive snapshots yields quests/day)
- **Active players 24 h** (#3 — sampled; known-inflated source, see Decision D2-6)

**(b) Derivable from timestamped rows — do NOT need snapshotting:**
- Signups over time (`pw_users.created_at`) → player-growth backfill is possible from day one of the game
- PvP fights/day (`pw_combat_log.created_at`)
- Chat messages/day (`pw_chat_messages.created_at`) — with the caveat that hard deletes/purges (none today) would erode it
- Faction/class distribution *at signup* (immutable columns + `created_at`)

The design still stores cheap copies of a few derivable running totals (pvp total) because a
30-row snapshot read is what lets the dashboard stop full-scanning `pw_combat_log` every poll.

## 2.3 `titan-cron.js` Fit

Read of the current file (42 lines): Vercel invokes it at **13:00 UTC** (`?event=morning`) and
**01:00 UTC** (`?event=evening`) per `vercel.json`; auth is `Authorization: Bearer ${CRON_SECRET}`
with a `requireAdmin` fallback for manual triggers from the admin Titan tab. The handler body is a
flat try/catch around three awaited steps and returns `{ ok, slot, processed, next_event_at }`.

**Appending a snapshot step is clean:** add it *after* `scheduleNextTitanEvent`, wrapped in its
**own** try/catch so a snapshot failure can only log and flag — never throw into the titan path —
and a titan failure (which returns 500 from the outer catch) simply means that firing skips the
snapshot (the other daily firing, or the next day's, covers it). No new function file, no third
cron — **confirmed within the Hobby limits (2 crons, both already used, both reused here).**

```js
// after titan work, before res:
let snapshot = 'skipped'
try {
  await writeDailySnapshot(sql)          // §2.4 query
  snapshot = 'ok'
} catch (err) {
  console.error('[titan-cron] snapshot failed (titan unaffected):', err)
  snapshot = 'failed'
}
return res.status(200).json({ ok: true, slot, processed: didWork, next_event_at: ..., snapshot })
```

**Timing semantics to be honest about:** with two firings, each calendar-date row is written at
01:00 UTC (1 h of the day elapsed) and overwritten at 13:00 UTC (13 h elapsed) — the 13:00 write
is each date's final state. Point-in-time *state* metrics (supply, distribution, totals) are
samples and this is fine. Trailing-24 h *count* columns are 13:00-to-13:00 windows, not calendar
days — chart labels should say "as of 13:00 UTC". True per-calendar-day event counts stay derived
from timestamped tables, not from the snapshot.

## 2.4 Proposed Schema — `pw_daily_stats`

One **wide row per day**, PK on the date. `BIGINT` for supplies (per-player drachma is `INTEGER`,
but a summed economy crosses 2^31 eventually). Distributions as small JSONB arrays — they're
display payloads, never filtered on.

```sql
-- DRAFT ONLY — Kyle runs this manually in the Neon SQL Editor. Never auto-executed.
CREATE TABLE IF NOT EXISTS pw_daily_stats (
  snapshot_date            DATE PRIMARY KEY,          -- UTC calendar date
  -- population (state)
  total_players            INTEGER  NOT NULL DEFAULT 0,
  active_players_24h       INTEGER  NOT NULL DEFAULT 0,  -- trailing 24h at snapshot time; source known-inflated (D2-6)
  -- economy (state — the irrecoverable core)
  total_drachma            BIGINT   NOT NULL DEFAULT 0,
  avg_drachma              INTEGER  NOT NULL DEFAULT 0,
  median_drachma           INTEGER  NOT NULL DEFAULT 0,  -- percentile_cont(0.5); whale-resistant
  total_drachma_lifetime   BIGINT   NOT NULL DEFAULT 0,  -- ever minted → inflation chart
  total_glory              BIGINT   NOT NULL DEFAULT 0,
  -- activity (running totals; per-day = diff vs previous row)
  quest_completions_total  BIGINT   NOT NULL DEFAULT 0,
  pvp_fights_total         BIGINT   NOT NULL DEFAULT 0,
  chat_messages_24h        INTEGER  NOT NULL DEFAULT 0,  -- trailing-24h sample
  -- distributions (state; JSONB display payloads)
  level_distribution       JSONB    NOT NULL DEFAULT '[]',  -- [{"level":N,"count":N}, ...]
  faction_distribution     JSONB    NOT NULL DEFAULT '[]',
  class_distribution       JSONB    NOT NULL DEFAULT '[]',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

No secondary index needed — reads are `ORDER BY snapshot_date DESC LIMIT 1` (latest) or a
`WHERE snapshot_date > CURRENT_DATE - 90` range, both served by the PK.

## 2.5 Snapshot Write (idempotent)

Single statement, safe to fire any number of times per day — `ON CONFLICT (snapshot_date)
DO UPDATE` means the latest firing wins:

```sql
INSERT INTO pw_daily_stats (
  snapshot_date, total_players, active_players_24h,
  total_drachma, avg_drachma, median_drachma, total_drachma_lifetime, total_glory,
  quest_completions_total, pvp_fights_total, chat_messages_24h,
  level_distribution, faction_distribution, class_distribution
)
SELECT
  CURRENT_DATE,
  (SELECT COUNT(*) FROM pw_users),
  (SELECT COUNT(DISTINCT user_id) FROM pw_player_stats WHERE last_updated > NOW() - INTERVAL '24 hours'),
  (SELECT COALESCE(SUM(drachma), 0)              FROM pw_player_stats),
  (SELECT COALESCE(AVG(drachma)::int, 0)         FROM pw_player_stats),
  (SELECT COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY drachma)::int, 0) FROM pw_player_stats),
  (SELECT COALESCE(SUM(drachma_lifetime), 0)     FROM pw_player_stats),
  (SELECT COALESCE(SUM(glory), 0)                FROM pw_player_stats),
  (SELECT COALESCE(SUM(completions), 0)          FROM pw_quest_progress),
  (SELECT COUNT(*)                               FROM pw_combat_log),
  (SELECT COUNT(*) FROM pw_chat_messages WHERE created_at > NOW() - INTERVAL '24 hours' AND deleted_at IS NULL),
  (SELECT COALESCE(jsonb_agg(jsonb_build_object('level', level, 'count', c) ORDER BY level), '[]'::jsonb)
     FROM (SELECT level, COUNT(*)::int AS c FROM pw_player_stats GROUP BY level) t),
  (SELECT COALESCE(jsonb_agg(jsonb_build_object('faction', faction, 'count', c)), '[]'::jsonb)
     FROM (SELECT faction, COUNT(*)::int AS c FROM pw_users GROUP BY faction) t),
  (SELECT COALESCE(jsonb_agg(jsonb_build_object('class', class, 'count', c)), '[]'::jsonb)
     FROM (SELECT class, COUNT(*)::int AS c FROM pw_users GROUP BY class) t)
ON CONFLICT (snapshot_date) DO UPDATE SET
  total_players = EXCLUDED.total_players,
  active_players_24h = EXCLUDED.active_players_24h,
  total_drachma = EXCLUDED.total_drachma,
  avg_drachma = EXCLUDED.avg_drachma,
  median_drachma = EXCLUDED.median_drachma,
  total_drachma_lifetime = EXCLUDED.total_drachma_lifetime,
  total_glory = EXCLUDED.total_glory,
  quest_completions_total = EXCLUDED.quest_completions_total,
  pvp_fights_total = EXCLUDED.pvp_fights_total,
  chat_messages_24h = EXCLUDED.chat_messages_24h,
  level_distribution = EXCLUDED.level_distribution,
  faction_distribution = EXCLUDED.faction_distribution,
  class_distribution = EXCLUDED.class_distribution,
  created_at = NOW();
```

(In implementation this lives as a `writeDailySnapshot(sql)` helper — natural home is
`lib/pwHelpers.js` next to the titan functions — called from the titan-cron step in §2.3.
`percentile_cont` cast syntax to be verified against Neon at implementation time;
`(percentile_cont(0.5) WITHIN GROUP (...))::int` is the safe form.)

Cost: one invocation of roughly the same aggregate scans the dashboard currently runs **every
30 seconds** — executed **twice per day** instead.

## 2.6 Admin Dashboard Integration Sketch

**New charts unlocked (impossible today):**
- Player growth line — `total_players` by day (plus a signups/day line derivable live from `pw_users.created_at`)
- Economy: `total_drachma` vs `total_drachma_lifetime` (supply vs ever-minted → sink health), avg vs median divergence (whale index), `total_glory`
- Quests/day and PvP fights/day — diff of consecutive running totals
- Active-players trend, level-distribution drift (e.g., latest vs 30-days-ago overlay)

**Read path:** add one lightweight branch to the existing admin-gated `admin_metrics` handler
(or a sibling `action=daily_stats`) in `game.js` — a switch case, **no new function file** —
returning `SELECT * FROM pw_daily_stats WHERE snapshot_date > CURRENT_DATE - 90 ORDER BY snapshot_date`.
~90 rows, PK-range read, trivially cacheable client-side.

**Replacing expensive "now" queries:** of the 14 per-poll queries, the heaviest full scans —
#4 levelDistribution, #7 economy SUM/AVG, #11 quest_progress SUM, #10 pvp_fights_total, #5/#6
distributions — can be served from the **latest snapshot row** (one PK read), keeping live
queries only for the genuinely "today" counters (#2, #3, #9, #13, #14) plus topRichest and
titanEvents. Net per-poll: **14 queries → ~8 cheap ones + 1 snapshot-row read**, and every
unbounded full-table scan leaves the 30-second loop. Rough query-load reduction on the game
side: ~45% by count, substantially more by rows scanned — and it stops growing with the tables.
Stat cards backed by the snapshot should carry an "as of 13:00 UTC" label instead of implying
live data.

## 2.7 Backfill Honesty

- **No history, starts at day one of snapshotting:** drachma/glory/lifetime supply, avg/median,
  level distribution, active-players sample, quests/day, chat sample. These begin the day the
  cron step ships — every day before that is permanently unreconstructable. (This is the
  argument for shipping D2 sooner rather than later.)
- **Partially backfillable from timestamps (optional one-time INSERTs):** `total_players` per
  historical day from `pw_users.created_at`; `pvp_fights_total` per day from
  `pw_combat_log.created_at`; approximate faction/class distributions (columns are immutable at
  signup). A backfill would populate only those columns and leave economy columns at 0/NULL —
  charts must tolerate sparse early rows. Recommendation: **skip the backfill**; derive
  player-growth history live from `created_at` when charting instead (it's cheap and exact),
  and let the snapshot table stay uniformly "real samples only".

## 2.8 D2 Decision Points (Kyle sign-off needed)

1. **Snapshot cadence** — write on both cron firings with last-write-wins at 13:00 UTC
   (recommended: free redundancy if one firing errors), or morning-only (`?event=morning` guard)
   for a purer "one sample per day at a fixed hour"?
2. **Level distribution granularity** — raw per-level JSONB (recommended: bucket at render time,
   keeps raw data) vs pre-bucketed (1–9, 10–19, …) to keep the row smaller?
3. **`median_drachma`** — include `percentile_cont(0.5)` (recommended: whale-resistant economy
   read, negligible cost at current scale) or keep avg only?
4. **`topRichest` snapshot** — excluded from the design (low historical value, bloats the row).
   Confirm exclusion, or should a top-10 JSONB be kept per day?
5. **Historical backfill** — skip entirely (recommended) vs one-time partial backfill of
   players/PvP/faction columns with sparse economy fields?
6. **`active_players_24h` source** — snapshot the current `last_updated`-derived number now
   (accepting that it freezes a known-inflated metric, audit §6), or hold that column until a
   `last_action_at` column exists so history starts accurate? (The rest of the snapshot need
   not wait either way.)
7. **Dashboard refactor scope** — ship the snapshot write alone first (data starts accruing),
   with the GameMetrics/AdminOverview read-side switch to snapshot-backed cards as a separate
   follow-up? (Recommended: decouples risk; the write side touches only titan-cron + one lib
   helper + one migration.)
8. **Where the read action lives** — extend `admin_metrics`'s response with a `daily` array vs
   a new `action=daily_stats` case in `game.js` (both are switch cases, zero new files)?

---

## Combined Function-Slot Ledger (post-D1, post-D2)

| Change | Files | Slots |
|---|---|---|
| D1 merge | −`auth/check.js`, −`auth/logout.js`, ~`auth/admin.js` | 11 → **9** |
| D2 rollup | ~`titan-cron.js` (append step), ~`game.js` (read case), ~`lib/pwHelpers.js` (helper), +1 manual migration | **9** (no change) |

End state: **9 / 12 used, 3 open (2 usable + 1 reserved), 2 crons / 2 used (unchanged).**

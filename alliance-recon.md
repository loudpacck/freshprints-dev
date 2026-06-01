# Alliance System — Recon Report

> RECON ONLY. No code changed, no migrations created. Investigation + findings for the
> upcoming Alliance system (alliances + treasury + power tiers + chat channel + Codex + UI route).
>
> **Note on output path:** The brief asked for `/home/claude/alliance-recon.md`, but this is a
> Windows environment (no Linux sandbox / `/home/claude` does not exist). Saved to the repo root
> at `B:\freshprints-dev\alliance-recon.md` instead.

---

## SECTION 1 — Vercel Function Capacity

**Hard limit: 12 serverless functions (Hobby). Currently used: 11. Headroom: exactly 1.**

Every `.js` under `api/` = 1 slot. Full list:

| # | File | Purpose |
|---|------|---------|
| 1 | `api/contact.js` | Contact/newsletter/intake email |
| 2 | `api/track.js` | Analytics event ingest |
| 3 | `api/auth/admin.js` | Admin login |
| 4 | `api/auth/check.js` | Admin session check |
| 5 | `api/auth/logout.js` | Admin logout |
| 6 | `api/auth/reset.js` | Account recovery |
| 7 | `api/auth/moderator.js` | Moderator auth |
| 8 | `api/admin/overview.js` | Admin dashboard data |
| 9 | `api/games/pantheon-wars/titan-cron.js` | Cron: Titan event scheduling/resolution |
| 10 | `api/games/pantheon-wars/auth.js` | PW signup/login/logout/me (`?action=`) |
| 11 | `api/games/pantheon-wars/game.js` | PW everything else (`?action=`, ~50 routes) |

**Recommendation: add ZERO new functions.** Fold all Alliance endpoints into `game.js` as new
`?action=alliance_*` routes. A new file would take us to 12/12 — at the ceiling, with no room for
any future feature. The whole game already follows the "one fat dispatcher" pattern (see §below),
so this is the established convention, not a workaround.

### Existing `game.js` action routes (router at `game.js:3996-4058`)

`quests`, `complete`, `inventory`, `equip`, `unequip`, `sell`, `consume`, `shop`, `buy`,
`leaderboard`, `allocate`, `stat_reset_free`, `temples`, `temples_buy`, `temples_upgrade`,
`alignment_choose`, `pvp_targets`, `pvp_attack`, `pvp_log`, `adventures`, `adventures_start`,
`adventures_abandon`, `adventures_claim`, `titan_status`, `titan_join`, `titan_claim`,
`titan_admin_trigger`, `titan_history`, `township`, `township_establish`, `township_upgrade`,
`codex`, `pending_rewards`, `acknowledge_reward`, `craftsmanship_claim`,
`chat_send`, `chat_fetch`, `chat_pusher_auth`, `chat_dm_threads`, `chat_dm_fetch`, `chat_dm_send`,
`chat_state`, `chat_mod_send`, `chat_mod_fetch`, `chat_moderate`, `chat_lift_moderation`,
`chat_list_moderations`, `chat_set_mod_badge`.

Plus `admin_metrics` (handled in the default export wrapper, before the user-auth gate).

**Dispatch shape** (`game.js:3996`): `const innerHandler = requireUserWithModCheck(async (req,res)=>{ ... if (action==='x') return handleX(...) ... })`.
Every authenticated action runs through `requireUserWithModCheck`, which sets `req.userId`,
`req.modId`, `req.modUsername`, `req.modShowBadge`. Before the action dispatch it also runs the
"catch-up" jobs: `checkAndCompleteAdventures`, `checkAndCompleteUpgrades`, `checkAndCompleteCrafts`,
`processExpiredTitanEvents`, `checkAndInsertTempleIncomeReward`. **Any new alliance action gets
`req.userId`/mod context for free.**

Proposed new actions (all in `game.js`): `alliance` (GET my alliance + roster + power),
`alliance_browse` (GET list/search), `alliance_create`, `alliance_invite`, `alliance_invite_respond`,
`alliance_leave`, `alliance_kick`, `alliance_promote`/`alliance_demote`, `alliance_disband`,
`alliance_donate` (drachma/glory/item), `alliance_treasury_log`, plus chat:
`chat_alliance_fetch`, `chat_alliance_send` (or extend `chat_send`/`chat_fetch` with `channel:'alliance'`).

---

## SECTION 2 — Dashboard Locked Alliance Tile

File: `src/pages/games/pantheon-wars/Dashboard.jsx`.

### The tile already exists (locked)

`NAV_ITEMS` (`Dashboard.jsx:13-26`) already contains the Alliance entry:

```js
{ label: 'ALLIANCE', glyph: '⚜', glyphStyle: { filter: 'grayscale(1) brightness(1.3)' },
  path: '/games/pantheon-wars/alliance', comingSoon: true },
```

(`STORE` is the only other `comingSoon: true` tile.)

### How tiles render — `NavButton` (`Dashboard.jsx:399-472`)

- **Locked** (`item.comingSoon` truthy): renders a plain `<div>` (NOT a `<Link>`) at
  `opacity: 0.45`, `cursor: 'not-allowed'`, a `title=` tooltip ("Coming soon — temples, PvP,
  inventory, and crew systems shipping in the next phase"), and a small **"SOON"** badge absolutely
  positioned top-right. Non-clickable.
- **Live**: wraps in `<Link to={item.path}>` with a `motion.div` (hover scale 1.05 / y -2, tap 0.97).

### Township / Temples references

- **TOWNSHIP** is in `NAV_ITEMS` (`path:/township`) AND has a dedicated **featured tile**
  `TownshipFeaturedTile` (`Dashboard.jsx:80-130`) that `fetch`es `?action=township`, shows
  "N/8 Professions Established", and `navigate`s to `/township-view` on click.
- **Temples** is in `NAV_ITEMS` (`path:/temples`) AND has a featured "TEMPLE INCOME" card
  (`Dashboard.jsx:875-943`) wrapped in `<Link to=/temples>`, fed by a `?action=temples` fetch.
- **Titan** also has a featured tile (`TitanFeaturedTile`).

So the dashboard pattern for a "big" system is: a featured summary tile (custom component, own
fetch) **plus** the small `NAV_ITEMS` button.

### Unlock condition

**There is none.** `comingSoon` is a hardcoded static boolean on the `NAV_ITEMS` entry. No
level/membership gate is checked anywhere. To go live: **delete `comingSoon: true`** from the
Alliance entry (line 24). If you want a real unlock gate (e.g. min level), you'd add a runtime
check in `NavButton` — none exists today.

---

## SECTION 3 — Pantheon Wars Routing

### Routes (`src/App.jsx`)

Pantheon Wars uses a **separate `<Routes>` block** — `PantheonWarsRoutes()` (`App.jsx:197-224`) —
that lives OUTSIDE the main `AnimatedRoutes`/`AnimatePresence` so the shell never remounts during
internal navigation (which would kill the intro music). All game routes are children of a single
parent route:

```jsx
<Route element={<PantheonWarsShell />}>
  <Route path="/games/pantheon-wars"            element={<PantheonDashboard />} />
  <Route path="/games/pantheon-wars/temples"    element={<PantheonTemples />} />     // line 207
  <Route path="/games/pantheon-wars/township"   element={<PantheonTownship />} />    // line 213
  ...
  <Route path="/games/pantheon-wars/codex"      element={<PantheonCodex />} />       // line 218
  <Route path="/games/pantheon-wars/alliance"   element={<PantheonComingSoon title="ALLIANCE" .../>} /> // line 219  ← REPLACE
  <Route path="/games/pantheon-wars/store"      element={<PantheonComingSoon title="STORE" .../>} />    // line 220
</Route>
```

**The `/alliance` route already exists** — it currently renders `<PantheonComingSoon>`. Pages are
lazy-loaded at top of `App.jsx` (`const PantheonTemples = lazy(() => import('.../Temples'))`, etc.,
lines 44-62). `AppInner` (`App.jsx:226-244`) detects `location.pathname.startsWith('/games/pantheon-wars')`
and renders `<PantheonWarsRoutes/>` inside a single `<Suspense>` — no Digital chrome, no terminal.

### `PantheonWarsShell`

The parent route element. It supplies the game context (`PantheonWarsContext`, consumed via
`usePantheonWars()` for `user`/`stats`/`loading`/`refresh`/`logout`) and the persistent chrome
(`ChatProvider` + `ChatBar` are imported in `App.jsx:14-15` and live inside the shell; the shell
also mounts the title-card/audio). Child routes render through its `<Outlet/>`.
*(Not opened in this recon — but its role is confirmed by the import graph and the comment at
`App.jsx:194-196`.)*

### Per-page chrome — `PWPageShell` (`src/components/games/pantheon-wars/PWPageShell.jsx`)

Every inner page renders its content inside `<PWPageShell title rightSlot backgroundVariant>`:
sticky ornate header (wordmark + `/ TITLE`), `PWBackground`, centered `<main maxWidth:640>`,
`PWHubLink`, `PWAudioControls`. It reads `useChat().isOpen` to pad the bottom for the chat bar.
The shared `.pw-skel` loading-shimmer keyframes are defined in its `<style>` block.

### Exact pattern to add `/games/pantheon-wars/alliance`

1. Add lazy import in `App.jsx`: `const PantheonAlliance = lazy(() => import('@/pages/games/pantheon-wars/Alliance'))`.
2. Replace the element on line 219 with `<PantheonAlliance />` (route path already correct).
3. Create `src/pages/games/pantheon-wars/Alliance.jsx` that returns
   `<PWPageShell title="ALLIANCE" rightSlot={<PWBackButton/>} backgroundVariant="...">...</PWPageShell>`
   and fetches `?action=alliance`. Mirror `Temples.jsx` structure (see §10).
4. Remove `comingSoon: true` from the `NAV_ITEMS` Alliance entry (`Dashboard.jsx:24`).
5. (Optional) Add an Alliance featured tile to the dashboard like `TownshipFeaturedTile`.

---

## SECTION 4 — Live Chat Extensibility (Alliance Channel)

### 4.1 `channel_type` CHECK constraint

`db/migrations/live-chat.sql:7`:

```sql
channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('general', 'mod', 'dm')),
```

**Must be widened to include `'alliance'`** via migration (drop + re-add CHECK). Until that runs,
any insert with `channel_type='alliance'` will be rejected.

### 4.2 `channel_id` is already a reusable nullable column ✓

`live-chat.sql:8`: `channel_id VARCHAR(50)` — NULL for general/mod, **the DM thread id as a string**
for DMs. A UUID is 36 chars, fits in VARCHAR(50). **Store the alliance UUID in `channel_id`.**
No per-alliance tables needed; this is exactly the DM pattern.

Existing index supports it: `idx_pw_chat_messages_channel ON (channel_type, channel_id, created_at DESC)`.

### 4.3 How `'mod'` is gated (the model to copy)

- **Send** `handleChatModSend` (`game.js:3636`): `if (!req.modId) return 403`. Inserts
  `channel_type='mod', channel_id=NULL`, triggers Pusher `private-mod`.
- **Fetch** `handleChatModFetch` (`game.js:3678`): same `req.modId` gate, `WHERE channel_type='mod'`.
- **Client** (`ChatContext.jsx:156-170`): only subscribes `private-mod` and shows the MOD tab if `isMod`.

**Alliance equivalent:** gate by membership instead of mod flag. In each alliance handler, look up
the caller's `alliance_id` from `pw_alliance_members WHERE user_id = req.userId` and use THAT id —
never trust a client-supplied alliance id for send/fetch (prevents reading another alliance's chat).

### 4.4 `handleChatSend` routing + Pusher naming

`handleChatSend` (`game.js:3320`) currently hard-rejects anything but `general`
(`if (channel !== 'general') return 400`). Two options:
- **(A)** Add an `else if (channel === 'alliance')` branch (resolve member's alliance, insert with
  `channel_id`, trigger `private-alliance-{id}`). Reuses `checkChatRateLimit` + mute checks.
- **(B)** New dedicated actions `chat_alliance_send` / `chat_alliance_fetch` (cleaner separation,
  mirrors the mod handlers). **Recommended (B)** for clarity and to keep membership resolution local.

**Pusher channel convention** (`getPusherServer` in `lib/pwPusher.js`, triggers throughout):
- `general` — public channel
- `private-mod` — mods only
- `private-user-{userId}` — per-user (DMs)

**Alliance channel: `private-alliance-{allianceId}`** — matches the brief's suggestion exactly and
fits the existing `private-*` auth convention.

**Auth** must be added to `handleChatPusherAuth` (`game.js:3416-3443`). Today it authorizes
`private-mod` (if `req.modId`) and `private-user-{id}` (if id === `req.userId`), else 403. Add:

```js
if (channel_name.startsWith('private-alliance-')) {
  const allianceId = channel_name.replace('private-alliance-', '')
  // verify req.userId is a member of allianceId, else 403
  ... authorizeChannel ...
}
```

### 4.5 `ChatBar.jsx` — adding a tab without breaking General/Private/Mod

Tabs are built dynamically (`ChatBar.jsx:831-835`):

```js
const TABS = [
  { id: 'general', label: 'GENERAL' },
  { id: 'private', label: 'PRIVATE' },
  ...(isMod ? [{ id: 'mod', label: 'MOD' }] : []),
]
```

Add: `...(allianceId ? [{ id: 'alliance', label: 'ALLIANCE' }] : [])`. The render area is a series
of `{activeTab === 'x' && (...)}` blocks (`:1108-1216`). Add an `{activeTab === 'alliance' && ...}`
block that reuses the existing `<MessageList>` + `<ChatInput>` (same as the General tab) — no
structural change to existing tabs. Unread badges follow the existing `unread.{tab}` pattern.

**`ChatContext.jsx`** (the source of truth for chat state) needs:
- `messages.alliance` array + `unread.alliance` in the state objects (`:15-16`).
- An `allianceId` value (fetch on mount alongside `chat_state`, or surface it from `usePantheonWars`).
- A history fetch (`chat_alliance_fetch`) when `allianceId` is set.
- A Pusher subscription `client.subscribe(`private-alliance-${allianceId}`)` inside the Pusher
  `useEffect` (`:107-173`), and **add `allianceId` to that effect's dependency array** (it already
  recreates the client when `isMod` changes — same pattern). Bind `new_message` / `message_deleted`.
- A `sendAllianceMessage` action (mirror `sendModMessage`, `:203-209`).

### 4.6 Scoping messages to an alliance without per-alliance tables

**Confirmed clean path:** reuse `pw_chat_messages` with `channel_type='alliance'` and
`channel_id = '<alliance_uuid>'`. Fetch = `WHERE channel_type='alliance' AND channel_id=$id AND
deleted_at IS NULL ORDER BY created_at DESC LIMIT 100`. This is byte-for-byte the DM approach. No
schema additions beyond widening the CHECK. Note `channel_id` has **no FK** (it's a VARCHAR), so
alliance dissolve must clean these up manually (see §12).

---

## SECTION 5 — Player Stat Exposure (Military Power)

`Military Power = SUM over members of (attack + defense + agility + energy_max + health_max)`.

### `pw_player_stats` columns

Base (`db/schema.sql:77-92`): `level, xp, energy, energy_max, health, health_max, drachma,
drachma_lifetime, glory, attack, defense, stat_points, last_updated`.
Migrations add: `glory_lifetime` (schema.sql:187), **`agility INTEGER DEFAULT 0`**
(`round-combat-system.sql:7`), `energy_regen_base`, `health_regen_base` (regen-fix), free-reset flag.

**All five needed columns exist:** `attack` ✓, `defense` ✓, `agility` ✓ (via migration),
`energy_max` ✓, `health_max` ✓. All `INTEGER`, all SUM-able.

### Township levels

`pw_player_townships.level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 100)`
(`schema.sql:250`). One row per `(user_id, upgrade_type)` (UNIQUE). **Integers, summable.** If
"alliance township power" means summed township levels: `SUM(level)` grouped by member set.

### Example existing cross-member aggregate (leaderboard mastery, `game.js:1042-1048`)

```sql
SELECT u.id, u.username, u.faction, u.class, COALESCE(SUM(qp.completions), 0) AS value
FROM pw_users u
LEFT JOIN pw_quest_progress qp ON qp.user_id = u.id
GROUP BY u.id, u.username, u.faction, u.class
ORDER BY value DESC, u.username LIMIT 100
```

Military Power baseline query (for a member set):

```sql
SELECT COALESCE(SUM(attack + defense + agility + energy_max + health_max), 0) AS military_power
FROM pw_player_stats
WHERE user_id = ANY($1::uuid[]);   -- alliance member ids
```

---

## SECTION 6 — Temple Income (Economic Power)

### Single-player calc — `regenPlayer` (`lib/pwHelpers.js:20-80`)

The loop (`:57-66`):

```js
let templeIncome = 0
for (const t of ownedTemples) {
  templeIncome += t.income_per_hour * (1 + 0.234 * Math.pow(t.upgrade_level, 1.03)) * hoursElapsed
}
// then per-player multipliers, NOT in the SQL below:
let templeMultiplier = 1.0
if (playerClass === 'broker')   templeMultiplier += 0.20   // Broker +20%
if (faction     === 'annunaki') templeMultiplier += 0.05   // Annunaki +5%
templeMultiplier += (townshipBonuses.temple_income_pct || 0) / 100   // Township Commerce
const incomeFloored = Math.floor(templeIncome * templeMultiplier)
```

`ownedTemples` rows are joined `pw_player_temples pt JOIN pw_temples t ON t.type = pt.temple_type`,
supplying `income_per_hour` and `upgrade_level`.

### Aggregate drachma/hr across member ids (validated)

The brief's proposed query is **correct and matches the code's base rate** (drop `hoursElapsed`):

```sql
SELECT COALESCE(SUM(t.income_per_hour * (1 + 0.234 * POWER(pt.upgrade_level::float, 1.03))), 0)
       AS economic_power
FROM pw_player_temples pt
JOIN pw_temples t ON t.type = pt.temple_type
WHERE pt.user_id = ANY($1::uuid[]);   -- alliance member ids
```

**Caveat — multipliers:** the per-player Broker/Annunaki/Township-Commerce multipliers (above) are
NOT in this SQL. For an alliance "baseline" they're arguably intentional to exclude (keeps it a pure
infrastructure metric, and computing per-member multipliers in SQL means joining `pw_users` +
`pw_player_townships` + summing township bonuses). **Recommendation: define Economic Power on the
raw baseline (this query) and document that class/faction/township perks are personal, not pooled.**
If you DO want parity with actual income, you'd have to replicate the JS multiplier cascade per
member — heavier, and a reason to cache (see §12).

---

## SECTION 7 — Item Rarity/Level (Donation Values)

Donation value = `rarity_value × level_required` (common=1, uncommon=5, rare=25, epic=100, legendary=500).

### `pw_items` schema (`db/schema.sql:132-145`)

```sql
slot VARCHAR(20) CHECK (slot IN ('weapon','armor','artifact','mount','companion')),
rarity VARCHAR(20) DEFAULT 'common'
  CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),   -- ✓ exactly the 5 tiers
level_required INTEGER DEFAULT 1,                                       -- ✓ INT
buy_price, sell_price, glory_price ...
```

(+ `round-combat-system.sql` / `items-combat-overhaul.sql` add `agility_bonus, crit_chance,
block_chance, dodge_chance`.)

**`rarity` (VARCHAR) ✓ and `level_required` (INT) ✓ both exist.** Distinct rarity values are exactly
the 5 in the CHECK constraint (confirmed by the seed + `Codex.jsx` `RARITY_COLOR` map at `:365`).
Your 5-tier value table maps cleanly.

### `pw_inventory` (`db/schema.sql:148-154`)

```sql
id SERIAL PRIMARY KEY,
user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
item_id INTEGER REFERENCES pw_items(id),
equipped BOOLEAN DEFAULT FALSE,
acquired_at TIMESTAMPTZ DEFAULT NOW()
```

**Removing on donation:** `DELETE FROM pw_inventory WHERE id = $1 AND user_id = $2`. Guard against
donating an **equipped** item (either reject if `equipped = true`, or auto-unequip first — see how
`handleSell`/`handleEquip` treat the `equipped` flag for the consistent rule). Join to `pw_items`
to read `rarity` + `level_required` for the credited value in the same transaction.

---

## SECTION 8 — Codex Extensibility

File: `src/pages/games/pantheon-wars/Codex.jsx`.

### `CATEGORIES` array (`Codex.jsx:9-80`)

10 categories, each `{ id, label, glyph, color, description }`: `lore, factions, classes,
alignments, professions (label "TOWNSHIP"), titans, loot, combat, quests, adventures`.

### Static vs dynamic

- **Static categories**: hardcoded `*_ENTRIES` arrays in the file (`LORE_ENTRIES`, `FACTION_ENTRIES`,
  `CLASS_ENTRIES`, `ALIGNMENT_ENTRIES`, `LOOT_ENTRIES`, `COMBAT_ENTRIES`, `QUEST_ENTRIES`,
  `ADVENTURE_ENTRIES`). Each entry: `{ id, title, subtitle, body, ...optional mechanics fields }`.
- **Dynamic categories**: `professions` and `titans` read from the API. `Codex` fetches
  `?action=codex` on mount (`:699-705`), and `getEntries()` (`:323-360`) maps `data.professions` /
  `data.titans` into entry shape. `isApiCategory = selectedCategory === 'titans' || 'professions'`
  drives the loading skeleton (`:725-726`).
- **Per-category mechanics rendering**: `MechanicsSection` (`:402-567`) has an `if (categoryId === X)`
  branch per category for custom stat grids/chips (factions→bonus, classes→bonus list,
  professions→cost/level grid, titans→stat grid, loot→drop tables, quests/adventures→tips).

### Cleanest way to add an ALLIANCES Codex category

**Static.** Alliance mechanics are rules text (ranks, treasury, power tiers, how to create/join) —
not live data. Steps:
1. Add `{ id:'alliances', label:'ALLIANCES', glyph:'⚜', color:'#C9A961', description:'...' }` to `CATEGORIES`.
2. Add an `ALLIANCE_ENTRIES` array (overview, ranks, treasury, military/economic power tiers, donations).
3. Add `case 'alliances': return ALLIANCE_ENTRIES` to `getEntries()`.
4. (Optional) Add a `MechanicsSection` branch if you want stat-grid presentation of tier thresholds.

Dynamic would only make sense if the Codex should list *live* alliances (not recommended — that's the
`/alliance` browse page's job, not a reference codex).

### Rate-limiting / validation to reuse

- `checkChatRateLimit(sql, userId)` (`pwHelpers.js:1518-1535`): 5 messages / 30s window, returns a
  `{ error:'rate_limited', retry_in_seconds:30 }` object or null. **Reusable to throttle alliance
  creation / invites / donations** (or write an analogous time-window counter against
  `pw_alliances.created_at` / `pw_alliance_invites.created_at`).
- **No name validator exists** to reuse. Signup (`api/.../auth.js:41`) only checks `username.length > 30`
  (no charset, no min, no profanity). Alliance name/tag need their own validation (length, charset,
  uniqueness via UNIQUE constraints — see §11) plus profanity (see §9).

---

## SECTION 9 — Profanity Filtering

**None exists.** Searched the codebase for `profan|bad-words|banned|blacklist|sanitiz|badwords`.
Matches were false positives: moderation strings ("…was **ban**ned by…") in `game.js`/`ChatBar.jsx`
and unrelated text in `media.js`. Chat safety today is **purely reactive** — moderators manually
delete/mute/timeout/ban/kick via `handleChatModerate` (`game.js:3699`). Usernames are not filtered.

### Suggested lightweight approach (filter applies to alliance **name AND tag**)

Recommend an **in-repo banned-word list** over an npm dependency (no install, deterministic, easy to
extend, and `bad-words` pulls a sizable English list with false positives like "hell"):

- New `lib/pwProfanity.js` exporting `containsProfanity(str)` and `validateAllianceName(name)` /
  `validateAllianceTag(tag)`.
- Normalize before matching: lowercase, strip non-alphanumerics, collapse repeats, optional basic
  leetspeak (`0→o, 1→i/l, 3→e, 4→a, 5→s, @→a, $→s`). Match against a small curated array
  (slurs + obvious profanity), substring-checked.
- Enforce alongside: length (e.g. name 3–24, tag 2–5), charset (`/^[A-Za-z0-9 ]+$/` for name,
  `/^[A-Z0-9]+$/` for tag), and DB UNIQUE constraints (case-insensitive — store/compare `LOWER()`).
- Call server-side in `alliance_create` (and any rename action). Reject with a clear error.

If a dependency is preferred later, `bad-words` works, but gate it behind the same normalize step.

---

## SECTION 10 — UI / Style Patterns to Follow

### Closest analog: `src/pages/games/pantheon-wars/Temples.jsx` (and `Township.jsx`)

Both have an "establish/buy" flow that the Alliance "create" flow should mirror. Anatomy of `Temples.jsx`:

- **Shell**: `<PWPageShell title="TEMPLES" rightSlot={<PWBackButton/>} backgroundVariant="temples">`.
- **Auth/redirect**: `usePantheonWars()` → if `!authLoading && !user` `navigate('/login', {replace:true})`.
- **Data**: `fetchTemples()` (useCallback) → `fetch('?action=temples')`, 401 → redirect, sets
  `catalog/owned/totalIncome/playerStats`, `finally setLoading(false)`.
- **Loading**: column of `<Skeleton h=.../>` (the `.pw-skel` shimmer from `PWPageShell`).
- **Error**: inline `// {error}` in red mono (`#F87171`).
- **Mutations**: `handleBuy` / `handleUpgrade` set a per-action busy flag (`buying`/`upgrading`),
  POST `?action=temples_buy`/`temples_upgrade`, on success → **toast + `play(sound)` +
  `await fetchTemples()` + `refreshContext()`**; on failure set inline `error`.
- **Cards**: `motion.button` with `whileHover/whileTap`, disabled styling, all colors from tokens.

### Status modals / toasts

**No global toast system.** Each page owns a local `toast` state + `<AnimatePresence>` + an
auto-dismiss component. Examples: `TempleToast` (`Temples.jsx:19-72`, auto-closes after 3400ms) and
`TownshipCompleteToast` (`Dashboard.jsx:478-517`). Fixed, top-center, framer slide-in, gold border.
Errors are shown **inline** (red mono text), not in modals. Modals that DO exist (e.g.
`Codex.jsx` `DetailModal`, `AdventureRewardModal`) use `createPortal(... , document.body)` +
`<motion.div>` backdrop + Escape-to-close. Copy whichever fits (toast for "Alliance created",
portal modal for a create form / confirm-disband).

### Loading states

`.pw-skel` class (shimmer keyframes in `PWPageShell.jsx:46-47`) + a local `Skeleton`/`SkeletonTile`
component. `SkeletonTiles` grid in Codex for tile layouts.

### Theme tokens (use these — never hardcode hex unless following the existing inline style)

Fonts: `--pw-font-display` (Cinzel), `--pw-font-mono` (IBM Plex Mono), `--pw-font-body` (DM Sans);
Bebas Neue used for big numbers. Colors: `--color-bg-base`, `--color-bg-elevated`,
`--color-accent-gold` / `-gold-bright` / `-gold-dim`, `--glow-gold`, `--color-text-primary` /
`-secondary` / `-muted`, `--color-success` (#5FB857-ish), `--color-danger`, `--color-border-frame`,
`--color-border-inner`. Faction colors (from `Dashboard.jsx:9`): olympians `#E8D080`,
aesir `#8AB8D4`, annunaki `#C25E3C`. Rarity colors (`Codex.jsx:365`): common `#9CA3AF`,
uncommon `#22C55E`, rare `#3B82F6`, epic `#A855F7`, legendary `#FBBF24`. Township/green accents
`#A8C97A`; temple/violet `#A78BFA`. *(Many existing PW pages use inline rgba literals matching these
tokens — match the surrounding file's convention.)*

---

## SECTION 11 — Proposed Data Tables (for review — NOT created)

Conventions followed: `UUID PK DEFAULT gen_random_uuid()`, `TIMESTAMPTZ DEFAULT NOW()`,
`ON DELETE CASCADE` from `pw_users`/`pw_alliances`, explicit indexes, CHECK on enums.

### a) `pw_alliances`

```sql
CREATE TABLE pw_alliances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(24)  NOT NULL,
  tag             VARCHAR(5)   NOT NULL,                 -- short [TAG]
  description     TEXT,
  leader_id       UUID NOT NULL REFERENCES pw_users(id) ON DELETE RESTRICT,
  emblem          VARCHAR(40),                            -- optional glyph/preset key
  member_count    INTEGER NOT NULL DEFAULT 1 CHECK (member_count >= 0),
  max_members     INTEGER NOT NULL DEFAULT 25,
  treasury_drachma BIGINT NOT NULL DEFAULT 0 CHECK (treasury_drachma >= 0),
  treasury_glory   BIGINT NOT NULL DEFAULT 0 CHECK (treasury_glory   >= 0),
  -- cached power (recomputed on membership change / periodically — see §12)
  military_power   BIGINT NOT NULL DEFAULT 0,
  economic_power   BIGINT NOT NULL DEFAULT 0,
  power_recomputed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pw_alliances_name_unique UNIQUE (name),     -- consider LOWER() unique index instead
  CONSTRAINT pw_alliances_tag_unique  UNIQUE (tag)
);
-- Case-insensitive uniqueness (preferred):
CREATE UNIQUE INDEX idx_pw_alliances_name_lower ON pw_alliances (LOWER(name));
CREATE UNIQUE INDEX idx_pw_alliances_tag_lower  ON pw_alliances (LOWER(tag));
```
- `leader_id` is `ON DELETE RESTRICT` so a leader can't be hard-deleted without succession; OR make
  it `ON DELETE SET NULL` + a "disband on empty" rule. **Design decision (see §12).**

### b) `pw_alliance_members`

```sql
CREATE TABLE pw_alliance_members (
  alliance_id  UUID NOT NULL REFERENCES pw_alliances(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES pw_users(id) ON DELETE CASCADE,
  rank         VARCHAR(20) NOT NULL DEFAULT 'member'
                 CHECK (rank IN ('leader','officer','member')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contributed_drachma BIGINT NOT NULL DEFAULT 0,   -- lifetime donation tracking (optional)
  contributed_glory   BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (alliance_id, user_id),
  CONSTRAINT pw_alliance_one_per_user UNIQUE (user_id)  -- a player is in at most ONE alliance
);
CREATE INDEX idx_pw_alliance_members_user ON pw_alliance_members(user_id);
CREATE INDEX idx_pw_alliance_members_alliance ON pw_alliance_members(alliance_id);
```
- `UNIQUE (user_id)` enforces single-alliance membership (critical for chat scoping in §4).

### c) `pw_alliance_invites`

```sql
CREATE TABLE pw_alliance_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id  UUID NOT NULL REFERENCES pw_alliances(id) ON DELETE CASCADE,
  inviter_id   UUID NOT NULL REFERENCES pw_users(id) ON DELETE CASCADE,
  invitee_id   UUID NOT NULL REFERENCES pw_users(id) ON DELETE CASCADE,
  direction    VARCHAR(10) NOT NULL DEFAULT 'invite'
                 CHECK (direction IN ('invite','request')),  -- invite TO player vs request TO JOIN
  status       VARCHAR(10) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','declined','expired','cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  CONSTRAINT pw_alliance_invite_unique UNIQUE (alliance_id, invitee_id, status)
    -- prevents duplicate pending invites; or use a partial unique index WHERE status='pending'
);
CREATE INDEX idx_pw_alliance_invites_invitee ON pw_alliance_invites(invitee_id, status);
CREATE INDEX idx_pw_alliance_invites_alliance ON pw_alliance_invites(alliance_id, status);
```
- The `UNIQUE(alliance_id, invitee_id, status)` is a coarse guard; a partial unique index
  `... (alliance_id, invitee_id) WHERE status='pending'` is cleaner.

### d) `pw_alliance_treasury_log`

```sql
CREATE TABLE pw_alliance_treasury_log (
  id           BIGSERIAL PRIMARY KEY,
  alliance_id  UUID NOT NULL REFERENCES pw_alliances(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES pw_users(id) ON DELETE SET NULL,  -- keep log if user deleted
  username     VARCHAR(30) NOT NULL,         -- denormalized (delete-cascade safety, like chat)
  entry_type   VARCHAR(20) NOT NULL
                 CHECK (entry_type IN ('donate_drachma','donate_glory','donate_item','withdraw','spend')),
  currency     VARCHAR(10) CHECK (currency IN ('drachma','glory', NULL)),
  amount       BIGINT NOT NULL DEFAULT 0,    -- currency amount, or computed item value
  item_id      INTEGER REFERENCES pw_items(id),  -- nullable; set for donate_item
  item_rarity  VARCHAR(20),                  -- denormalized snapshot
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pw_alliance_treasury_log_alliance ON pw_alliance_treasury_log(alliance_id, created_at DESC);
```
- `username` denormalized exactly like `pw_chat_messages.sender_username` so the audit log survives
  member deletion.

---

## SECTION 12 — Known Blockers / Open Questions

### Function-slot crunch (HIGH)
11/12 used. **Alliance must consolidate into `game.js`** (`?action=alliance_*`). A separate file =
12/12 = zero future headroom. Non-negotiable given the Store tile is also still pending.

### Performance — SUM across members on every load (HIGH)
Military Power (5-col SUM across ≤25 members) and especially Economic Power (`POWER()` over every
member's temples, joined) are too heavy to compute live on each dashboard/alliance render — and the
dashboard already fires several fetches on mount. **Cache `military_power` / `economic_power` on
`pw_alliances`** (columns proposed in §11a). Recompute on membership change (join/leave/kick) and
on a timer. The `titan-cron.js` cron already exists and runs periodically — it could piggyback an
alliance-power refresh, OR recompute lazily with a short TTL via `power_recomputed_at`. Avoid
recomputing on read.

### Cascade-delete edge cases (HIGH)
- **Alliance chat has no FK.** `pw_chat_messages.channel_id` is a plain VARCHAR, so dissolving an
  alliance does NOT auto-remove its chat. The disband handler MUST
  `DELETE FROM pw_chat_messages WHERE channel_type='alliance' AND channel_id = $allianceId` (or
  soft-delete). Don't rely on cascade.
- **Leader deletion / departure.** Decide: `leader_id ON DELETE RESTRICT` (blocks user deletion
  until succession) vs auto-promote-oldest-officer vs auto-disband-if-empty. Account deletion path
  (`/api/auth/reset.js`? user removal) needs to handle this.
- **`pw_alliance_members` UNIQUE(user_id)** must be enforced atomically on join to prevent a player
  joining two alliances in a race.

### Migration order (MEDIUM)
1. Create the four `pw_alliance_*` tables.
2. **ALTER `pw_chat_messages` CHECK to add `'alliance'`** — this must be live BEFORE any alliance
   chat send, or inserts 400/throw.
3. **Add the `private-alliance-` branch to `handleChatPusherAuth`** before clients subscribe, or
   subscriptions 403.
These can be one migration + one code deploy, but the CHECK alter and the auth branch are
prerequisites for the chat half — schedule the chat-channel work AFTER the alliance tables/membership
exist (membership is how chat access is gated).

### Ambiguities needing design sign-off before building
- **Power tier thresholds**: the numeric bands for Military/Economic Power tiers are undefined.
- **Treasury currencies**: drachma + glory both? Item donations credit which? (Proposed: items convert
  to a value but are they stored as treasury value, or as alliance-owned inventory? Schema assumes
  value-credit; confirm.)
- **Donating equipped items**: reject, or auto-unequip? (Pick one rule, consistent with `handleSell`.)
- **Invite model**: invite-only, request-to-join, or both (`direction` column covers both — confirm).
- **Max members**: 25 assumed (matches the brief's "SUM across 25 members"). Confirm.
- **Rank permissions**: who can invite/kick/spend treasury/disband? (leader vs officer matrix.)
- **Disband semantics**: treasury refunded to members? forfeited? Chat purged (yes, see above).
- **Name/tag rules**: exact length/charset and whether rename is allowed post-creation (affects
  whether profanity re-validation is needed on edit).

### Minor / non-blocking
- `agility` defaults to 0 for old accounts but the column exists everywhere — safe to SUM.
- No global toast/validation utilities — each alliance UI surface owns its toast (matches the
  codebase; just more boilerplate).
- Username validation is minimal today; don't assume any shared validator — alliance fields need
  their own (§9, §11).

---

## Quick "what already exists" summary

| Thing | Status |
|-------|--------|
| `/games/pantheon-wars/alliance` route | **Exists** → renders `ComingSoon` (replace element) |
| Dashboard ALLIANCE tile | **Exists** with `comingSoon:true` (remove flag to unlock) |
| Chat table reusable for alliance | **Yes** — widen `channel_type` CHECK, store id in `channel_id` |
| Pusher `private-alliance-{id}` convention | Fits existing `private-*` pattern (add auth branch) |
| Stat columns (atk/def/agi/energy_max/health_max) | **All present** |
| Temple income formula + aggregate SQL | **Confirmed**, brief's query validated |
| Item rarity/level + inventory delete | **All present** |
| Codex add-category path | Static category (add to `CATEGORIES` + `*_ENTRIES` + `getEntries`) |
| Profanity filter | **Does not exist** — build a small in-repo list |
| Closest UI analog | `Temples.jsx` (+ `Township.jsx`) establish/toast/loading flow |
| New function files needed | **Zero** — fold into `game.js` `?action=alliance_*` |

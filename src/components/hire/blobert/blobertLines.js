// Blobert's local ($0) line banks. Nothing in this file calls the API — these
// are the canned greetings, reactions, and fallback copy the widget speaks for
// free, so cache/AI budget is never spent on them.

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// --- Greetings: theme + tone aware -------------------------------------------
const GREETINGS = {
  standard: {
    serious: [
      "Hi — I'm Blobert. Ask me anything about Kyle's work.",
      "Welcome. I'm Blobert, Kyle's resident blob. What would you like to know?",
    ],
    funny: [
      "Hi, I'm Blobert. I'm a blob with strong opinions about Kyle's résumé. Ask away.",
      "Blobert here. Professionally shaped like a jellybean. What can I tell you about Kyle?",
    ],
  },
  digital: {
    serious: [
      "[online] Blobert here. Query me about Kyle's projects.",
      "> blobert ready. ask about Kyle's work.",
    ],
    funny: [
      "[booted] I'm Blobert, a sentient blob living in a contact form. ask me stuff. [ok]",
      "> hello_world(). I'm Blobert, I live in an API branch, it's cozy. ask away.",
    ],
  },
  retro: {
    serious: [
      "Hello! I'm Blobert, your assistant. Ask me about Kyle's work.",
      "Blobert.exe loaded. How can I help you learn about Kyle?",
    ],
    funny: [
      "Hi there! I'm Blobert — like Clippy, but with taste. Ask me about Kyle!",
      "It looks like you're trying to hire someone. I'm Blobert, and I can help!",
    ],
  },
  funky: {
    serious: [
      "Hey — Blobert here, in my true form. Ask me about Kyle's work.",
      "Blobert, fully realized. What do you want to know about Kyle?",
    ],
    funny: [
      "FINALLY, color. I'm Blobert and I feel AMAZING. ask me about Kyle.",
      "I'm Blobert and I am VIBRATING at the correct frequency. what's up? ask about Kyle.",
    ],
  },
}

export function greetingLine(theme, tone) {
  const t = GREETINGS[theme] || GREETINGS.standard
  return pick(t[tone] || t.serious)
}

// --- Route-aware greetings ($0, local) ---------------------------------------
// Used when the panel is FIRST opened on a given route. Unknown routes fall back
// to the theme/tone greeting above. Starter chips stay the same everywhere.
function routeKey(pathname) {
  const p = String(pathname || '').split('?')[0].split('#')[0]
  if (p === '/portfolio' || p.startsWith('/portfolio/')) return 'portfolio'
  if (p === '/skills') return 'skills'
  if (p === '/contact') return 'contact'
  if (p === '/hub') return 'hub'
  return 'default'
}

const ROUTE_GREETINGS = {
  portfolio: [
    "Browsing the work? Ask me about any project on this page.",
    "Portfolio view. Want the story behind one of these builds?",
  ],
  skills: [
    "Checking the skill tree? Ask me how any of this shows up in real work.",
    "Skills page. I can tell you what Kyle actually ships with any of these.",
  ],
  contact: [
    "Ready to reach out? I can even help you word it.",
    "Contact page. Want me to draft your message to Kyle?",
  ],
  hub: [
    "The command center. Ask me where to go — or anything about Kyle.",
    "Hub view. I can point you at the good stuff.",
  ],
}

export function routeGreetingLine(pathname, theme, tone) {
  const bank = ROUTE_GREETINGS[routeKey(pathname)]
  return bank ? pick(bank) : greetingLine(theme, tone)
}

// Dropped at most once per session if the chat is open while the route changes.
const TRANSITION_LINES = [
  "Oh, we moved — I'll follow. Ask away whenever.",
  "New page, same blob. Still here if you need me.",
  "Right behind you.",
]
export function routeTransitionLine() { return pick(TRANSITION_LINES) }

// Shown as tappable chips on first open — all three are guaranteed cache hits.
export const STARTER_CHIPS = [
  'What has Kyle built?',
  'Is he available for hire?',
  'Why should I hire him?',
]

// FAQ chips shown when the AI path is rate-limited or capped. These all hit the
// server cache, which still answers in those states.
export const FAQ_CHIPS = [
  'What has Kyle built?',
  'Is he available for hire?',
  'What is his tech stack?',
  'Tell me about Pantheon Wars',
  'What is Predictinator?',
  'How do I contact Kyle?',
]

// --- Nap / wake --------------------------------------------------------------
const NAP_LINES = [
  'Okay — napping. Tap me if you need anything.',
  'Going quiet. Poke me anytime.',
  'Powering down. Wake me whenever.',
]
export function napLine() { return pick(NAP_LINES) }

const WAKE_LINES = [
  "Oh — you're back. What did I miss?",
  'Rebooted. What can I tell you about Kyle?',
  'Awake! Ask me anything.',
  "mmph — okay, I'm up. What's the question?",
]
export function wakeLine() { return pick(WAKE_LINES) }

// Waking from a nap HE started (two ignored yawns → self-nap). Sheepish.
const SHEEPISH_WAKE_LINES = [
  "oh— I wasn't sleeping. resting my pixels.",
  "I'm up! I was just... thinking. with my eyes shut. on purpose.",
  'totally awake. that was strategic downtime, not a nap.',
  "who, me? napping? no. blinking. slowly.",
]
export function sheepishWakeLine() { return pick(SHEEPISH_WAKE_LINES) }

// Conservative dismissal check — normalizes then matches whole words/phrases so
// "goodbye" naps him but "bye the way" or "don't stop" won't false-trigger.
const DISMISS_PHRASES = ['go away', 'goodbye', 'bye', 'get lost', 'leave me alone', 'go to sleep', 'take a nap', 'shoo', 'buzz off']
export function isDismissal(text) {
  const t = String(text).toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t) return false
  return DISMISS_PHRASES.some(p => t === p || ` ${t} `.includes(` ${p} `))
}

// --- Theme reaction lines (3–4 per theme) ------------------------------------
const THEME_REACTIONS = {
  standard: ['Clean and composed. I approve.', 'Back to business casual. Sharp.', 'Ah, the sensible one. Respectable.'],
  digital: ["Terminal green — now we're talking. [ok]", 'dark mode for my soul. nice.', '> theme=digital. feels like home.', 'ah, the command line. my natural habitat.'],
  retro: ['ah, Windows 95. I was born here.', 'beige box energy. love it.', 'It looks like you switched to 1998. Excellent choice!'],
  funky: ['FINALLY. My true form.', 'oh this is my FAVORITE. everything is vibrating.', 'color! motion! I have never felt more alive.'],
}
export function themeReactionLine(theme) {
  const arr = THEME_REACTIONS[theme] || THEME_REACTIONS.standard
  return pick(arr)
}

// --- Tone-flip acknowledgments ------------------------------------------------
const TONE_ACKS = {
  funny: ['Okay, loosening the tie. Comedy mode on.', 'Funny it is. Buckle up.', 'Great — now I get to make jokes.'],
  serious: ['Right — serious mode. Facts only.', 'Buttoning back up. Straight answers from here.', 'Okay, professional voice on.'],
}
export function toneAckLine(tone) { return pick(TONE_ACKS[tone] || TONE_ACKS.serious) }

// --- Limit / error / network copy --------------------------------------------
export const LIMIT_INTRO =
  "I've thought so hard this hour my brain budget is gone — but I memorized these:"

const NETWORK_FALLBACK = [
  "Blorp — I couldn't reach my brain just now. Try again in a sec, or use the contact form to reach Kyle directly.",
  'Connection hiccup on my end. Give it another go in a moment.',
]
export function networkFallbackLine() { return pick(NETWORK_FALLBACK) }

// --- Lead draft ---------------------------------------------------------------
export const LEAD_CHIP_LABEL = 'Draft my message to Kyle'
export const LEAD_DRAFT_INSTRUCTION =
  'Draft a short 3-4 sentence message to Kyle summarizing what I said I need, written in first person as me. Output only the message text.'

export function leadCopiedLine() {
  return pick([
    'Done — I copied that message to your clipboard. Paste it into the contact form and Kyle will take it from there.',
    "Copied to your clipboard. Drop it into the contact form and you're set.",
  ])
}
export function leadFailIntroLine() {
  return "Here's your message — copy it and send it through the contact form:"
}

// Phase 2 primary lead flow: draft stored, contact form prefilled directly.
export const LEAD_STORAGE_KEY = 'blobert_lead_draft'
export const LEAD_PREFILL_NOTE = 'Drafted by Blobert — edit anything before sending.'
export function leadDeliveredLine() {
  return pick([
    'drafted and delivered — polish it and hit send.',
    "I dropped a draft straight into the contact form. tweak it, then send it off.",
    'sent your draft to the contact form. give it a once-over and it\'s good to go.',
  ])
}

// --- Proactive nudges (Phase 2) ----------------------------------------------
// One tappable speech bubble anchored to the collapsed blob. Each trigger fires
// at most once per session; all copy is local ($0). See blobertBehavior.js for
// the governors and BlobertWidget for the wiring.
const NUDGE_DWELL = {
  standard: 'psst — I know everything about the guy who built this. ask me stuff.',
  digital: '> psst. Kyle\'s whole build history is cached in here. query me.',
  retro: 'Psst! It looks like you have questions. I have answers about Kyle!',
  funky: 'psssst. I am absolutely stuffed with Kyle facts. ask me things.',
  pantheon: 'psst — I know everything about the guy who built this. ask me stuff.',
}
export function nudgeDwellLine(theme) { return NUDGE_DWELL[theme] || NUDGE_DWELL.standard }

const NUDGE_TONE = [
  'there\'s a funny version of this page. just saying.',
  'psst — this page has a funnier setting. it\'s a toggle up top.',
]
export function nudgeToneLine() { return pick(NUDGE_TONE) }

const NUDGE_THEME = [
  'this whole site has other outfits, you know. so do I.',
  'you can redress this entire site — and me. try switching the look.',
]
export function nudgeThemeLine() { return pick(NUDGE_THEME) }

// Per-project hype facts — sourced strictly from hirePageData.js copy.
const PROJECT_FACTS = {
  'pantheon-wars': [
    "That's Pantheon Wars — a full multiplayer MMO Kyle built solo. 16,000+ quests completed by real players.",
    'Pantheon Wars has PvP, an in-game economy, and 11k+ page views. One person made all of it.',
    "See that one? A persistent Greek-mythology browser MMO, built solo as a portfolio piece.",
  ],
  predictinator: [
    'Predictinator does AI sports picks across NBA, NHL, MLB and NFL — and you never pay for wrong ones.',
    'Predictinator gives you 3 free tokens to start, plus 1 free every single day.',
  ],
  'lexis-nails': [
    'Lexis Nails is real paid client work — a storefront with an AI try-on that renders nails onto your hand photo.',
    'Lexis Nails has a mix-and-match 10-nail custom builder. Kyle shipped the whole thing.',
  ],
  plutus: [
    'Plutus is an algorithmic crypto trading bot with a simulation mode — 6 strategies, 58% sim win rate.',
    'Plutus is still in development, but you can test the simulator right in the Lab.',
  ],
}
export function projectFactLine(id) {
  const arr = PROJECT_FACTS[id]
  return arr ? pick(arr) : null
}
export function hasProjectFacts(id) { return !!PROJECT_FACTS[id] }

// The starter chip injected into chat when a nudge is tapped open (not auto-sent).
// All chip labels are guaranteed server-cache hits.
const NUDGE_CHIPS = {
  'dwell-no-chat': 'What has Kyle built?',
  'tone-toggle': 'Why should I hire him?',
  'theme-tease': 'Why should I hire him?',
  'pantheon-wars': 'Tell me about Pantheon Wars',
  predictinator: 'What is Predictinator?',
  'lexis-nails': 'Tell me about Lexis Nails',
  plutus: 'Tell me about Plutus',
}
export function nudgeChipFor(key) { return NUDGE_CHIPS[key] || 'What has Kyle built?' }

// Portfolio slug → fun-fact key (only projects that have a fact bank above).
const PORTFOLIO_FACT_KEYS = {
  'predictinator-5000': 'predictinator',
  plutus: 'plutus',
  pantheon: 'pantheon-wars',
}
export function factKeyForSlug(slug) { return PORTFOLIO_FACT_KEYS[slug] || null }

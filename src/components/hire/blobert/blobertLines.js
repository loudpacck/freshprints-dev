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

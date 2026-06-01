// Lightweight profanity filter for alliance names and tags.
// NOT enterprise-grade: a small curated list, exact word-boundary matching,
// no leetspeak normalization, no fuzzy/edit-distance matching.
//
// Word-boundary matching (token split, not substring) means clean words that
// merely contain a banned substring — e.g. "Scunthorpe", "assassin", "Cockburn" —
// are NOT flagged. Only standalone banned tokens are.

const BANNED_WORDS = [
  // racial / ethnic slurs
  'nigger', 'nigga', 'chink', 'gook', 'spic', 'wetback', 'kike', 'wop',
  'paki', 'coon', 'beaner', 'raghead', 'towelhead', 'gyppo', 'redskin',
  // sexual / homophobic slurs
  'faggot', 'fag', 'dyke', 'tranny', 'queer', 'homo',
  // sexual / vulgar
  'fuck', 'fucker', 'fucking', 'motherfucker', 'cunt', 'twat', 'pussy',
  'cock', 'dick', 'penis', 'vagina', 'whore', 'slut', 'bastard',
  'bitch', 'wank', 'wanker', 'jizz', 'cum', 'boner',
  // scatological / general profanity
  'shit', 'shite', 'bullshit', 'crap', 'piss', 'asshole', 'arsehole',
  'douche', 'dildo', 'rape', 'rapist', 'molest',
  // hate / extremist
  'nazi', 'hitler', 'kkk',
]

const BANNED_SET = new Set(BANNED_WORDS)

/**
 * Returns true if the text contains a banned word as a standalone token.
 * @param {string} text
 * @returns {boolean}
 */
export function isProfane(text) {
  if (!text || typeof text !== 'string') return false
  const normalized = text.toLowerCase().trim()
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean)
  for (const token of tokens) {
    if (BANNED_SET.has(token)) return true
  }
  return false
}

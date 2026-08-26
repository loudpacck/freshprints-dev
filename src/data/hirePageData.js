// All values here are editable; a future /admin tab will write to these.
// This file is the single source of truth for every number and piece of
// card copy shown on the /hire page.

function formatCommas(n) {
  return n.toLocaleString('en-US')
}

function formatCompactDrachma(n) {
  return `~${(n / 1_000_000).toFixed(1)}M`
}

// --- Hero copy ---------------------------------------------------------
// Default active set is "confident". The toggle on the page flips to "funny".
export const heroCopy = {
  confident: {
    headline: "Let's make your vision real.",
    subhead: 'Software, games, hardware, AI — I take an idea and ship it as a working product. Browse a few I built below, then let\'s build yours.',
  },
  funny: {
    headline: 'I built a multiplayer MMO instead of updating my résumé.',
    subhead: 'It has quests, PvP, and an in-game economy. My résumé has a font. Judge accordingly.',
  },
}

// Alternate headline/subhead options — Kyle can swap these into `heroCopy` above.
// export const heroCopyAlternates = {
//   confidentB: {
//     headline: "You imagine it. I build it. Here's the proof.",
//     subhead: 'Software, games, hardware, AI — built end to end, not just demoed.',
//   },
//   funnyB: {
//     headline: 'A hire-me page with a 26,000-view game inside it. Yes, I need help. Hire me.',
//     subhead: 'I clearly have time to build an MMO but apparently none left for LinkedIn.',
//   },
// }

// --- Pantheon Wars live stats (sourced from the admin panel) -----------
export const pantheonWarsStats = {
  gamePageViews: 11458,
  questsCompleted: 16820,
  pvpFights: 1181,
  drachmaEconomy: 1932314,
  activePlayers: 25,
}

// --- Featured project cards ---------------------------------------------
// buildHireProjects accepts a pantheonWarsStats-shaped object so the /hire
// page can regenerate this list with live values fetched from the admin DB,
// falling back to the static defaults above when the fetch hasn't landed yet.
export function buildHireProjects(stats = pantheonWarsStats) {
  return [
  {
    id: 'pantheon-wars',
    name: 'Pantheon Wars',
    tagline: 'Persistent Greek-mythology browser MMO, built solo as a portfolio piece.',
    stats: [
      { label: 'Game Page Views', value: formatCommas(stats.gamePageViews) },
      { label: 'Quests Completed', value: formatCommas(stats.questsCompleted) },
      { label: 'PvP Battles', value: formatCommas(stats.pvpFights) },
      { label: 'Drachma in Circulation', value: formatCompactDrachma(stats.drachmaEconomy) },
    ],
    buttonLabel: 'Play Here',
    buttonUrl: '/games/pantheon-wars',
    isExternal: false,
    thumbnail: '/thumbnails/pantheon_wars/pantheon_wars.webp',
  },
  {
    id: 'predictinator',
    name: 'Predictinator 6000',
    tagline: 'AI sports predictions for NBA, NHL, MLB, and NFL.',
    highlight: 'You never pay for wrong predictions.',
    supporting: '3 free tokens to start, plus 1 free every day. NBA, NHL, and MLB are live now — NFL picks return in season.',
    stats: [],
    buttonLabel: 'Predict Here',
    buttonUrl: 'https://predictinator.net',
    isExternal: true,
    thumbnail: '/thumbnails/predictinator/predictinator thumbnail.webp',
  },
  {
    id: 'lexis-nails',
    name: 'Lexis Nails',
    tagline: 'E-commerce storefront for hand-painted, one-of-a-kind press-on nails — real, paid client work.',
    features: [
      { label: 'Build a Set', desc: 'A mix-and-match custom 10-nail builder.' },
      { label: 'Try On Hands', desc: 'AI preview that renders your chosen nails onto a real hand photo via OpenAI gpt-image-2.' },
    ],
    stats: [],
    buttonLabel: 'Check it out',
    buttonUrl: 'https://www.lexisnails.com/',
    isExternal: true,
    thumbnail: '/thumbnails/lexisnails/lexis nails tb 1.webp',
  },
  {
    id: 'plutus',
    name: 'Plutus',
    tagline: 'Algorithmic crypto trading bot with a simulation mode. Status: in development.',
    stats: [
      { label: 'Strategies', value: '4' },
      { label: 'Sim Win Rate', value: '58%' },
    ],
    buttonLabel: 'Test Here',
    buttonUrl: '/lab/plutus',
    isExternal: false,
    thumbnail: '/thumbnails/plutus/plutus.webp',
  },
  ]
}

// Default/fallback list, computed from the static pantheonWarsStats above.
// Pages should prefer the useHirePageStats hook, which starts from this and
// swaps in live DB values once fetched.
export const hireProjects = buildHireProjects(pantheonWarsStats)

// --- Bottom CTAs ---------------------------------------------------------
export const bottomCtas = {
  otherStuff: { label: 'Other Stuff', url: '/portfolio' },
  letsWork: { label: "Let's Work", url: '/services' },
}

export default {
  heroCopy,
  pantheonWarsStats,
  buildHireProjects,
  hireProjects,
  bottomCtas,
}

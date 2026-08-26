export const experiments = [
  {
    slug: 'cad-viewer',
    name: 'CAD Library',
    shortName: 'CAD VIEWER',
    status: 'STABLE',
    classification: 'INTERACTIVE GALLERY',
    description: 'Browse and orbit production CAD models in your browser. Specs, materials, and manufacturing notes included.',
    category: 'engineering',
    component: 'CADViewer',
    accentColor: '#A0A0B8',
    thumbnail: null,
  },
  {
    slug: 'beat-beaters',
    name: 'BEAT BEATERS',
    shortName: 'BEAT BEATERS',
    status: 'IN_DEVELOPMENT',
    classification: 'RHYTHM GAME',
    description: '9-lane rhythm game. Guitar Hero meets DDR.',
    category: 'games',
    component: null,
    accentColor: '#FF3B3B',
    thumbnail: '/thumbnails/beatbeaters/beatbeaters.webp',
  },
  {
    slug: 'pantheon-wars',
    name: 'Pantheon Wars',
    shortName: 'PANTHEON WARS',
    status: 'ACTIVE',
    classification: 'LIVE BROWSER GAME',
    description: 'A persistent multiplayer text RPG inspired by classic browser games. Choose a faction (Olympians, Aesir, Annunaki), pick a class, and rise through quest tiers earning XP, drachma, and glory. 40+ quests across 5 tiers with full leveling, regen mechanics, and faction/class bonuses. Built end to end — auth, database, game logic, UI.',
    category: 'games',
    component: null,
    accentColor: '#FFB347',
    external: true,
    externalUrl: '/games/pantheon-wars',
    thumbnail: '/thumbnails/pantheon_wars/pantheon_wars.webp',
  },
]

export function getExperimentBySlug(slug) {
  return experiments.find(e => e.slug === slug) || null
}

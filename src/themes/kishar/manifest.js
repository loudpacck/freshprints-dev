export const kisharManifest = {
  id: 'kishar',
  // Picker label is 'Pantheon' — the site theme is the cousin of the live game,
  // Pantheon Wars. The internal id stays 'kishar' so it never collides with the
  // game-only 'pantheon' theme that PantheonWarsShell forces on /games routes.
  label: 'Pantheon',
  tagline: 'Gilded leather and parchment.',
  description:
    "The same gold and obsidian Pantheon Wars runs on, rebuilt as a site: leather panels, bronze rules, inscribed headings.",
  status: 'complete',
  supportsLightMode: true,
  supportsDarkMode: true,
  defaultMode: 'dark',
  layoutType: 'traditional',
  navigation: 'navbar',
  hasSoundFx: true,
  soundPack: 'kishar',
  fonts: {
    display: 'Alegreya SC',
    body: 'Alegreya',
    mono: 'IBM Plex Mono',
  },
  hidden: false,
  palette: ['#0A0710', '#2A1B12', '#C9A961', '#3B2A5A', '#EDE3CC'],
}

export default kisharManifest

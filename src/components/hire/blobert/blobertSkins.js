// Per-theme visual config for Blobert. The EYES are identical in every skin
// (drawn in BlobertBlob) — only the body layer changes here. Every value
// references a theme design token. The four themes expose slightly different
// token vocabularies, so each color uses a fallback chain that resolves in all
// of them (Digital native `--color-*`, plus the alias bridges the others ship).

const ACCENT = 'var(--color-accent-primary)'
const GLOW = 'var(--color-accent-primary-glow, var(--color-accent-primary))'
const PANEL = 'var(--color-bg-surface)'
const PANEL_ELEVATED = 'var(--color-bg-elevated, var(--color-bg-surface))'
const BORDER = 'var(--color-border-subtle, var(--color-bg-elevated, var(--color-bg-surface)))'
const TEXT = 'var(--color-text-primary)'
const TEXT_2 = 'var(--color-text-secondary, var(--color-text-primary))'
const TEXT_MUTED = 'var(--color-text-muted, var(--color-text-secondary, var(--color-text-primary)))'
const BASE = 'var(--color-bg-base)'

// Colors shared by the chat panel chrome across all skins.
const sharedColors = {
  accent: ACCENT,
  glow: GLOW,
  panel: PANEL,
  panelElevated: PANEL_ELEVATED,
  border: BORDER,
  text: TEXT,
  textSecondary: TEXT_2,
  textMuted: TEXT_MUTED,
  base: BASE,
  onAccent: 'var(--color-bg-base)',
}

const standardSkin = {
  key: 'standard',
  colors: sharedColors,
  fonts: {
    display: 'var(--font-display, var(--font-body, sans-serif))',
    body: 'var(--font-body, sans-serif)',
    mono: 'var(--font-mono, monospace)',
  },
  radius: 'var(--radius-lg, 12px)',
  bubbleShadow: 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.28))',
  body: {
    fill: PANEL_ELEVATED,
    stroke: BORDER,
    strokeWidth: 1.5,
    rim: 'none',
    radius: '50%',
    breathe: true, jitter: false, morph: false, bevel: false, scanlines: false, crispEdges: false,
    gradient: null,
  },
}

const digitalSkin = {
  key: 'digital',
  colors: sharedColors,
  fonts: {
    display: 'var(--font-display, sans-serif)',
    body: 'var(--font-body, sans-serif)',
    mono: 'var(--font-mono, monospace)',
  },
  radius: 'var(--radius-lg, 8px)',
  bubbleShadow: `0 0 22px ${GLOW}`,
  body: {
    fill: 'var(--color-bg-surface)',
    stroke: ACCENT,
    strokeWidth: 1.5,
    rim: GLOW,
    radius: '50%',
    breathe: false, jitter: true, morph: false, bevel: false, scanlines: true, crispEdges: false,
    gradient: null,
  },
}

const retroSkin = {
  key: 'retro',
  colors: sharedColors,
  fonts: {
    display: 'var(--font-display, sans-serif)',
    body: 'var(--font-body, sans-serif)',
    mono: 'var(--font-mono, monospace)',
  },
  radius: '0px',
  bubbleShadow: 'none',
  body: {
    fill: 'var(--color-bg-elevated, #C0C0C0)',
    stroke: 'var(--bevel-dark, rgba(0,0,0,0.45))',
    strokeWidth: 2,
    rim: 'none',
    radius: '0px',
    breathe: false, jitter: false, morph: false, bevel: true, scanlines: false, crispEdges: true,
    gradient: null,
  },
}

const funkySkin = {
  key: 'funky',
  colors: sharedColors,
  fonts: {
    display: 'var(--font-display, sans-serif)',
    body: 'var(--font-body, sans-serif)',
    mono: 'var(--font-mono, monospace)',
  },
  radius: 'var(--radius-blob, 24px)',
  bubbleShadow: 'var(--shadow-lime, 0 10px 30px rgba(0,0,0,0.35))',
  body: {
    fill: ACCENT,
    stroke: 'none',
    strokeWidth: 0,
    rim: 'none',
    radius: 'var(--radius-blob, 42% 58% 55% 45% / 48% 42% 58% 52%)',
    breathe: false, jitter: false, morph: true, bevel: false, scanlines: false, crispEdges: false,
    gradient: 'var(--gradient-hero, linear-gradient(135deg, var(--color-accent-primary), var(--accent-secondary, var(--color-accent-primary))))',
  },
}

// Keyed map — pantheon deliberately reuses the standard skin so swapping in real
// Pantheon art later is a one-key change.
export const blobertSkins = {
  standard: standardSkin,
  digital: digitalSkin,
  retro: retroSkin,
  funky: funkySkin,
  pantheon: { ...standardSkin, key: 'pantheon' },
}

// The API only knows four themes; pantheon speaks 'standard' per the brain's
// contract, and its skin already maps to standard above.
export function apiThemeFor(themeId) {
  return themeId === 'pantheon' ? 'standard' : (blobertSkins[themeId] ? themeId : 'standard')
}

export function getSkin(themeId) {
  return blobertSkins[themeId] || blobertSkins.standard
}

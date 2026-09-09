// Section eyebrows carry a per-theme decorator.
//
// Digital keeps the `// LABEL` code-comment form — it matches the terminal
// chrome that theme is built around. The other three themes previously
// inherited the same marker, which read as one template stamped everywhere,
// so each now gets a mark that belongs to its own UI language:
//   Standard — bare label; the hairline tick in StandardSectionHeader is the mark
//   Retro    — `[ LABEL ]`, the Win95 group-box / menu-label convention
//   Funky    — `~ LABEL ~`, matching the theme's liquid wave motif
//   Kishar   — `· LABEL ·`, an inscription: small caps flanked by middots,
//              the way a carved or tooled line is centred between two points
export function formatEyebrow(label, themeId) {
  const bare = String(label ?? '').replace(/^\s*\/\/\s*/, '')
  if (!bare) return bare
  if (themeId === 'digital') return `// ${bare}`
  if (themeId === 'retro') return `[ ${bare} ]`
  if (themeId === 'funky') return `~ ${bare} ~`
  if (themeId === 'kishar') return `· ${bare} ·`
  return bare
}

// Themes whose eyebrow mark already brackets the label don't also want the
// Standard hairline tick in front of it.
export function eyebrowHasTick(themeId) {
  return themeId !== 'retro' && themeId !== 'funky' && themeId !== 'kishar'
}

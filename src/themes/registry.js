import digital from './digital/manifest'
import pantheon from './pantheon/manifest'
import standard from './standard/manifest'
import funky from './funky/manifest'
import retro from './retro/manifest'
import kishar from './kishar/manifest'

export const themes = { digital, pantheon, standard, funky, retro, kishar }
export const themeIds = Object.keys(themes)

export function getTheme(id) {
  return themes[id] || themes.standard
}

export function getAvailableThemes() {
  return themeIds.filter(id => !themes[id].hidden)
}

export function getCompleteThemes() {
  return themeIds.filter(id => themes[id].status === 'complete')
}

// 'pantheon' is the LIVE GAME's stylesheet, forced on by PantheonWarsShell for
// /games routes only. It is not a site theme and must never be offered as one,
// so it is excluded here by id rather than by editing its manifest (that file
// is game production code). The site-theme cousin is 'kishar', labelled
// "Pantheon" in the picker.
export const PICKER_EXCLUDED = new Set(['pantheon'])

// Themes that appear in the UI picker: all non-hidden complete themes + comingSoon previews
export function getPickerThemes() {
  return themeIds.filter(id =>
    !PICKER_EXCLUDED.has(id) && (!themes[id].hidden || themes[id].comingSoon)
  )
}

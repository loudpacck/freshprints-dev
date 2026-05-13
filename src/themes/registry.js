import digital from './digital/manifest'
import pantheon from './pantheon/manifest'
import standard from './standard/manifest'
import funky from './funky/manifest'
import retro from './retro/manifest'

export const themes = { digital, pantheon, standard, funky, retro }
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

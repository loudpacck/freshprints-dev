import { createContext, useContext, useEffect, useState } from 'react'
import { getTheme } from './registry'
import { soundManager } from '@/sound/SoundManager'

const ThemeContext = createContext(null)

const STORAGE_THEME = 'fp-theme'
const STORAGE_MODE  = 'fp-mode'
const DEFAULT_THEME = 'standard'

function getSystemColorScheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveMode(pref) {
  return pref === 'auto' ? getSystemColorScheme() : pref
}

function readInitialTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const params = new URLSearchParams(window.location.search)
  const param = params.get('ui') || params.get('theme')
  if (param) return param
  return localStorage.getItem(STORAGE_THEME) || DEFAULT_THEME
}

function readInitialModePref() {
  if (typeof window === 'undefined') return 'auto'
  const params = new URLSearchParams(window.location.search)
  const param = params.get('mode')
  if (param) return param
  return localStorage.getItem(STORAGE_MODE) || 'auto'
}

function readCrt() {
  if (typeof localStorage === 'undefined') return 'on'
  return localStorage.getItem('fp-retro-crt') || 'on'
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState(readInitialTheme)
  const [modePref, setModePrefState] = useState(readInitialModePref)
  const [mode, setModeState] = useState(() => resolveMode(readInitialModePref()))

  const manifest = getTheme(themeId)

  // Keep resolved mode in sync with modePref and system changes
  useEffect(() => {
    if (modePref !== 'auto') {
      setModeState(modePref)
      return
    }
    setModeState(getSystemColorScheme())
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function onSystemChange(e) {
      setModePrefState(current => {
        if (current === 'auto') setModeState(e.matches ? 'dark' : 'light')
        return current
      })
    }
    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }, [modePref])

  // Apply theme to DOM + persist
  useEffect(() => {
    document.documentElement.dataset.ui = themeId
    localStorage.setItem(STORAGE_THEME, themeId)

    if (themeId === 'retro') {
      // Retro: single mode — set CRT state, no data-mode
      delete document.documentElement.dataset.mode
      const crt = readCrt()
      document.documentElement.setAttribute('data-crt', crt)
    } else {
      document.documentElement.dataset.mode = mode
      localStorage.setItem(STORAGE_MODE, modePref)
      // Remove CRT overlay when leaving retro
      document.documentElement.removeAttribute('data-crt')
    }

    // Sound pack + per-theme mute
    if (manifest.soundPack) {
      soundManager.setPack(manifest.soundPack)
      soundManager.setActiveTheme(themeId)
    } else {
      soundManager.setActiveTheme(themeId)
    }
  }, [themeId, mode, modePref, manifest.soundPack])

  function setTheme(id) {
    setThemeIdState(id)
  }

  function setMode(pref) {
    setModePrefState(pref)
    if (pref !== 'auto') setModeState(pref)
    else setModeState(getSystemColorScheme())
  }

  function toggleMode() {
    setMode(mode === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ themeId, mode, modePref, manifest, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

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
  // Check ?ui= param first, then legacy ?theme= param, then localStorage
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

export function ThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState(readInitialTheme)
  // modePref: 'dark' | 'light' | 'auto'
  const [modePref, setModePrefState] = useState(readInitialModePref)
  // mode: resolved 'dark' | 'light' (never 'auto')
  const [mode, setModeState] = useState(() => resolveMode(readInitialModePref()))

  const manifest = getTheme(themeId)

  // Keep resolved mode in sync with modePref and system changes
  useEffect(() => {
    if (modePref !== 'auto') {
      setModeState(modePref)
      return
    }
    // Auto: track system preference
    setModeState(getSystemColorScheme())
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function onSystemChange(e) {
      // Only react if still in auto mode
      setModePrefState(current => {
        if (current === 'auto') {
          setModeState(e.matches ? 'dark' : 'light')
        }
        return current
      })
    }
    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }, [modePref])

  // Apply to DOM + persist
  useEffect(() => {
    document.documentElement.dataset.ui   = themeId
    document.documentElement.dataset.mode = mode
    localStorage.setItem(STORAGE_THEME, themeId)
    localStorage.setItem(STORAGE_MODE, modePref)
    if (manifest.soundPack) {
      soundManager.setPack(manifest.soundPack)
    }
  }, [themeId, mode, modePref, manifest.soundPack])

  function setTheme(id) {
    setThemeIdState(id)
  }

  // setMode accepts 'dark' | 'light' | 'auto'
  function setMode(pref) {
    setModePrefState(pref)
    if (pref !== 'auto') setModeState(pref)
    else setModeState(getSystemColorScheme())
  }

  // toggleMode cycles: dark → light → dark (quick toggle, not auto)
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

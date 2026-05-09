import { createContext, useContext, useEffect, useState } from 'react'
import { getTheme } from './registry'
import { soundManager } from '@/sound/SoundManager'

const ThemeContext = createContext(null)

const STORAGE_THEME = 'fp-theme'
const STORAGE_MODE = 'fp-mode'
const DEFAULT_THEME = 'digital'
const DEFAULT_MODE = 'dark'

function readInitialTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const param = new URLSearchParams(window.location.search).get('theme')
  if (param) return param
  return localStorage.getItem(STORAGE_THEME) || DEFAULT_THEME
}

function readInitialMode() {
  if (typeof window === 'undefined') return DEFAULT_MODE
  const param = new URLSearchParams(window.location.search).get('mode')
  if (param) return param
  return localStorage.getItem(STORAGE_MODE) || DEFAULT_MODE
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState(readInitialTheme)
  const [mode, setModeState] = useState(readInitialMode)

  const manifest = getTheme(themeId)

  useEffect(() => {
    document.documentElement.dataset.ui = themeId
    document.documentElement.dataset.mode = mode
    localStorage.setItem(STORAGE_THEME, themeId)
    localStorage.setItem(STORAGE_MODE, mode)
    if (manifest.soundPack) {
      soundManager.setPack(manifest.soundPack)
    }
  }, [themeId, mode, manifest.soundPack])

  function setTheme(id) {
    setThemeIdState(id)
  }

  function toggleMode() {
    setModeState(m => m === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ themeId, mode, manifest, setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

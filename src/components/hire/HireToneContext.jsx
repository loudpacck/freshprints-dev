import { createContext, useContext, useState } from 'react'

// Shared serious/funny copy toggle for the /hire page. Provided high in the
// tree (AppInner) so the state survives the hero remounting on theme swaps, and
// so Blobert can read the same live tone the hero is currently showing.
const HireToneContext = createContext(null)

export function HireToneProvider({ children }) {
  const [copyMode, setCopyMode] = useState('confident') // 'confident' | 'funny'
  return (
    <HireToneContext.Provider value={{ copyMode, setCopyMode }}>
      {children}
    </HireToneContext.Provider>
  )
}

// Reads the shared tone. Falls back to isolated local state when rendered
// outside a provider so the hero components never crash in isolation.
export function useHireTone() {
  const ctx = useContext(HireToneContext)
  const [local, setLocal] = useState('confident')
  return ctx || { copyMode: local, setCopyMode: setLocal }
}

// The page toggle speaks 'confident' | 'funny'; the Blobert brain expects
// 'serious' | 'funny'. 'confident' maps to 'serious'.
export function toneFromCopyMode(copyMode) {
  return copyMode === 'funny' ? 'funny' : 'serious'
}

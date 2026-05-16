import { useEffect, useState, useCallback } from 'react'
import { ambienceManager } from './AmbienceManager'

export function useAmbience() {
  const [isMuted, setIsMuted] = useState(() => ambienceManager.isMuted())

  const toggleMute = useCallback(() => {
    const next = ambienceManager.toggleMute()
    setIsMuted(next)
    return next
  }, [])

  useEffect(() => {
    function onStateChange(e) { setIsMuted(e.detail.muted) }
    window.addEventListener('fp-ambience-state-change', onStateChange)
    return () => {
      window.removeEventListener('fp-ambience-state-change', onStateChange)
    }
  }, [])

  return { isMuted, toggleMute }
}

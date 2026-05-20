import { useEffect, useState, useCallback } from 'react'
import { soundManager } from './SoundManager'

export function useSound() {
  const [isMuted, setIsMuted] = useState(() => soundManager.getMuted())

  const play = useCallback((name) => soundManager.play(name), [])
  const playAtVolume = useCallback((name, scale) => soundManager.playAtVolume(name, scale), [])

  const toggleMute = useCallback(() => {
    const newState = soundManager.toggleMute()
    setIsMuted(newState)
    return newState
  }, [])

  useEffect(() => {
    function onStateChange(e) {
      setIsMuted(e.detail.muted)
    }
    window.addEventListener('fp-sound-state-change', onStateChange)

    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setIsMuted(soundManager.getMuted())
    mq.addEventListener('change', handler)

    return () => {
      window.removeEventListener('fp-sound-state-change', onStateChange)
      mq.removeEventListener('change', handler)
    }
  }, [])

  return { play, playAtVolume, isMuted, toggleMute }
}

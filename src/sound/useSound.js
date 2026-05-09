import { useEffect, useState, useCallback } from 'react'
import { soundManager } from './SoundManager'

export function useSound() {
  const [isMuted, setIsMuted] = useState(() => soundManager.getMuted())

  const play = useCallback((name) => soundManager.play(name), [])

  const toggleMute = useCallback(() => {
    const newState = soundManager.toggleMute()
    setIsMuted(newState)
    return newState
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setIsMuted(soundManager.getMuted())
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return { play, isMuted, toggleMute }
}

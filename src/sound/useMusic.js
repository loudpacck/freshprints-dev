import { useEffect, useState, useCallback } from 'react'
import { musicManager } from './MusicManager'

export function useMusic() {
  const [isMuted,   setIsMuted]   = useState(() => musicManager.isMuted())
  const [isPlaying, setIsPlaying] = useState(() => musicManager.isPlaying())

  const play       = useCallback((src, opts) => musicManager.play(src, opts), [])
  const stop       = useCallback(() => musicManager.stop(), [])

  const toggleMute = useCallback(() => {
    const next = musicManager.toggleMute()
    setIsMuted(next)
    return next
  }, [])

  useEffect(() => {
    function onStateChange(e) { setIsMuted(e.detail.muted) }
    function onPlayback(e)    { setIsPlaying(e.detail.playing) }
    window.addEventListener('fp-music-state-change',    onStateChange)
    window.addEventListener('fp-music-playback-change', onPlayback)
    return () => {
      window.removeEventListener('fp-music-state-change',    onStateChange)
      window.removeEventListener('fp-music-playback-change', onPlayback)
    }
  }, [])

  return { isMuted, isPlaying, toggleMute, play, stop }
}

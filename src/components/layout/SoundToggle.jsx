import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSound } from '@/sound/useSound'

function SpeakerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 7h3l5-4v14l-5-4H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <path d="M14 6.5c1.2 0.8 2 2.1 2 3.5s-0.8 2.7-2 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16.5 4c2 1.3 3.5 3.4 3.5 6s-1.5 4.7-3.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MutedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 7h3l5-4v14l-5-4H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <path d="M15 8l4 4M19 8l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function SoundToggle() {
  const { pathname } = useLocation()
  const { isMuted, toggleMute, play } = useSound()

  if (pathname === '/' || pathname === '/hub') return null

  function handleClick() {
    const wasMuted = isMuted
    toggleMute()
    // Play the toggle tick — only audible when un-muting (since muted state suppresses sounds)
    // We flip state first, then play; since toggleMute updates soundManager.muted before returning,
    // if we were muted and are now un-muted, the sound will play.
    if (wasMuted) {
      // We just un-muted — play now (manager is already unmuted)
      play('toggle')
    }
    // If we just muted, play('toggle') would be suppressed — that's correct behavior
  }

  return (
    <motion.button
      onClick={handleClick}
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        zIndex: 'var(--z-sticky)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-medium)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        color: 'var(--color-text-secondary)',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-2) var(--space-4)',
        cursor: 'pointer',
        transition: 'color var(--duration-base), border-color var(--duration-base)',
      }}
      whileHover={{
        color: 'var(--color-text-accent)',
        borderColor: 'var(--color-accent-primary)',
      }}
    >
      {isMuted ? <MutedIcon /> : <SpeakerIcon />}
      {isMuted ? 'MUTED' : 'SOUND'}
    </motion.button>
  )
}

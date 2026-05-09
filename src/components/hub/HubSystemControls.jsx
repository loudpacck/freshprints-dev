import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSound } from '@/sound/useSound'
import UIPicker from './UIPicker'

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

function LayersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2L2 6l8 4 8-4-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 10l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2 14l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

const btnStyle = {
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
  padding: '0.5rem 0.875rem',
  cursor: 'pointer',
  transition: 'color var(--duration-base), border-color var(--duration-base)',
}

export default function HubSystemControls({ reduced }) {
  const { isMuted, toggleMute, play } = useSound()
  const [pickerOpen, setPickerOpen] = useState(false)

  function handleSound() {
    const wasMuted = isMuted
    toggleMute()
    if (wasMuted) play('toggle')
  }

  return (
    <>
      <motion.div
        initial={reduced ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          bottom: 'var(--space-8)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 'var(--z-sticky)',
          display: 'flex',
          gap: 'var(--space-3)',
        }}
      >
        <motion.button
          onClick={handleSound}
          style={btnStyle}
          whileHover={{ color: 'var(--color-text-accent)', borderColor: 'var(--color-accent-primary)' }}
          aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {isMuted ? <MutedIcon /> : <SpeakerIcon />}
          {isMuted ? 'MUTED' : 'SOUND'}
        </motion.button>

        <motion.button
          onClick={() => { play('modalOpen'); setPickerOpen(true) }}
          style={btnStyle}
          whileHover={{ color: 'var(--color-text-accent)', borderColor: 'var(--color-accent-primary)' }}
          aria-label="Change UI theme"
        >
          <LayersIcon />
          CHANGE UI
        </motion.button>
      </motion.div>

      <UIPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  )
}

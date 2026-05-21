import { useSound } from '@/sound/useSound'
import { useMusic } from '@/sound/useMusic'
import { useAmbience } from '@/sound/useAmbience'
import { useChat } from './ChatContext'

// Inline SVG: sound waves
function IconSound() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <polygon points="1,4 5,4 8,1 8,13 5,10 1,10" fill="currentColor" opacity="0.9" />
      <path d="M10 4.5 Q12 7 10 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// Inline SVG: sound waves crossed out
function IconSoundOff() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <polygon points="1,4 5,4 8,1 8,13 5,10 1,10" fill="currentColor" opacity="0.45" />
      <line x1="10" y1="4.5" x2="13" y2="9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="13" y1="4.5" x2="10" y2="9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function AudioBtn({ label, muted, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={`${label}: ${muted ? 'muted' : 'active'} — click to toggle`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        background: 'rgba(10,7,16,0.72)',
        border: `1px solid ${muted ? 'rgba(201,169,97,0.12)' : 'rgba(201,169,97,0.38)'}`,
        borderRadius: 7,
        padding: '7px 9px',
        cursor: 'pointer',
        color: muted ? 'rgba(201,169,97,0.3)' : 'rgba(201,169,97,0.85)',
        transition: 'color 140ms, border-color 140ms, background 140ms',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = muted ? 'rgba(201,169,97,0.55)' : 'rgba(245,216,139,1)'
        e.currentTarget.style.borderColor = muted ? 'rgba(201,169,97,0.25)' : 'rgba(245,216,139,0.6)'
        e.currentTarget.style.background = 'rgba(10,7,16,0.88)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = muted ? 'rgba(201,169,97,0.3)' : 'rgba(201,169,97,0.85)'
        e.currentTarget.style.borderColor = muted ? 'rgba(201,169,97,0.12)' : 'rgba(201,169,97,0.38)'
        e.currentTarget.style.background = 'rgba(10,7,16,0.72)'
      }}
    >
      {muted ? <IconSoundOff /> : <IconSound />}
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 7,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        lineHeight: 1,
        userSelect: 'none',
      }}>
        {label}
      </span>
    </button>
  )
}

export default function PWAudioControls() {
  const { isMuted: sfxMuted,    toggleMute: toggleSfx    } = useSound()
  const { isMuted: musicMuted,  toggleMute: toggleMusic  } = useMusic()
  const { isMuted: ambMuted,    toggleMute: toggleAmb    } = useAmbience()
  const { isOpen } = useChat()

  if (isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '52px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        gap: 6,
      }}
    >
      <AudioBtn label="SFX"    muted={sfxMuted}   onToggle={toggleSfx}   />
      <AudioBtn label="MUSIC"  muted={musicMuted} onToggle={toggleMusic} />
      <AudioBtn label="AMB"    muted={ambMuted}   onToggle={toggleAmb}   />
    </div>
  )
}

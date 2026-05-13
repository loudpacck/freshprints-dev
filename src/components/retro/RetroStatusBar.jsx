import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSound } from '@/sound/useSound'

function formatTime(date) {
  let h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

function getCrtState() {
  return document.documentElement.getAttribute('data-crt') || 'on'
}

const RAISED = `inset 1px 1px 0 var(--bevel-highlight), inset -1px -1px 0 var(--bevel-dark), inset 2px 2px 0 var(--bevel-light), inset -2px -2px 0 var(--bevel-shadow)`
const INSET  = `inset 1px 1px 0 var(--bevel-dark), inset -1px -1px 0 var(--bevel-highlight), inset 2px 2px 0 var(--bevel-shadow), inset -2px -2px 0 var(--bevel-light)`

function StartButton({ onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      title="Start — return to home"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        minWidth: 70,
        height: 22,
        padding: '0 var(--space-3)',
        background: 'var(--bg-elevated)',
        border: 'none',
        boxShadow: pressed ? INSET : RAISED,
        transform: pressed ? 'translate(1px,1px)' : 'none',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-md)',
        fontWeight: 700,
        color: 'var(--text-primary)',
        cursor: 'pointer',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Four-pane Windows-style flag */}
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
        <rect x="1" y="1" width="5" height="5" fill="#FF0000" />
        <rect x="8" y="1" width="5" height="5" fill="#00AA00" />
        <rect x="1" y="8" width="5" height="5" fill="#0000BB" />
        <rect x="8" y="8" width="5" height="5" fill="#FFAA00" />
      </svg>
      Start
    </button>
  )
}

export default function RetroStatusBar({ onOpenPicker }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { play, isMuted, toggleMute } = useSound()
  const [time, setTime] = useState(() => formatTime(new Date()))
  const [crt, setCrt] = useState(getCrtState)

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 30000)
    return () => clearInterval(id)
  }, [])

  function toggleCrt() {
    play('click')
    const next = crt === 'on' ? 'off' : 'on'
    document.documentElement.setAttribute('data-crt', next)
    localStorage.setItem('fp-retro-crt', next)
    setCrt(next)
  }

  function handleStart() {
    play('click')
    navigate('/home')
  }

  const pageName = location.pathname === '/home' ? '/home'
    : location.pathname === '/' ? '/'
    : location.pathname

  const smallBtn = {
    padding: '0 6px',
    height: 18,
    background: 'var(--bg-elevated)',
    border: 'none',
    boxShadow: RAISED,
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    userSelect: 'none',
  }

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      zIndex: 100,
      height: 28,
      padding: '0 6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--bg-elevated)',
      borderTop: '2px solid var(--bevel-highlight)',
      userSelect: 'none',
    }}>
      {/* Left: Start + status + page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
        <StartButton onClick={handleStart} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', flexShrink: 0 }}>
          READY
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          Page: {pageName}
        </span>
      </div>

      {/* Right: clock + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-primary)', minWidth: 58, textAlign: 'right' }}>
          {time}
        </span>

        <button style={smallBtn} onClick={toggleCrt} title="Toggle CRT effects">
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: crt === 'on' ? '#00CC00' : '#808080',
            display: 'inline-block', flexShrink: 0,
          }} />
          CRT
        </button>

        <button style={smallBtn} onClick={() => toggleMute()} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? '🔇' : '🔊'}
        </button>

        <button style={smallBtn} onClick={() => { play('click'); onOpenPicker?.() }} title="Switch UI">
          [UI]
        </button>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useSound } from '@/sound/useSound'

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LockBodyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  )
}

export default function AdminLoginModal({ onClose }) {
  const { play } = useSound()

  useEffect(() => {
    play('modalOpen')
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key === 'Escape') { play('modalClose'); onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, play])

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-bg-overlay)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          maxWidth: 420,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => { play('modalClose'); onClose() }}
          aria-label="Close admin modal"
          style={{
            position: 'absolute',
            top: 'var(--space-4)',
            right: 'var(--space-4)',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color var(--duration-base)',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          <CloseIcon />
        </button>

        {/* Lock icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(0, 200, 255, 0.08)',
          border: '1px solid rgba(0, 200, 255, 0.2)',
          color: 'var(--color-accent-primary)',
          marginBottom: 'var(--space-6)',
        }}>
          <LockBodyIcon />
        </div>

        {/* Eyebrow */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-accent-primary)',
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-2)',
        }}>
          // ADMIN ACCESS
        </p>

        {/* Heading */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--tracking-wide)',
          marginBottom: 'var(--space-3)',
        }}>
          AUTHENTICATION REQUIRED
        </h2>

        {/* Subtitle */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          lineHeight: 'var(--leading-relaxed)',
          marginBottom: 'var(--space-6)',
        }}>
          Admin panel under construction. Full authentication and dashboard ship in Phase 11.
        </p>

        {/* Password input (disabled) */}
        <input
          type="password"
          placeholder="PASSWORD"
          disabled
          style={{
            width: '100%',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-3) var(--space-4)',
            outline: 'none',
            opacity: 0.5,
            cursor: 'not-allowed',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
            boxSizing: 'border-box',
            marginBottom: 'var(--space-3)',
          }}
        />

        {/* Authenticate button (disabled) */}
        <button
          disabled
          style={{
            width: '100%',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            color: 'var(--color-text-inverse)',
            background: 'var(--color-accent-primary)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-3) var(--space-4)',
            cursor: 'not-allowed',
            opacity: 0.4,
            marginBottom: 'var(--space-6)',
          }}
        >
          AUTHENTICATE
        </button>

        {/* Coming soon note */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
          opacity: 0.6,
          textAlign: 'center',
        }}>
          // COMING SOON — STATS, ANALYTICS, SESSION TRACKING, MORE
        </p>
      </motion.div>
    </motion.div>,
    document.body
  )
}

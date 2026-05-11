import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        play('success')
        onClose()
        navigate('/admin')
      } else {
        play('error')
        setError('// ACCESS DENIED')
        setPassword('')
      }
    } catch {
      play('error')
      setError('// CONNECTION ERROR')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

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
          Enter admin password to continue.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Password input */}
          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            disabled={loading}
            style={{
              width: '100%',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg-surface)',
              border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'var(--color-border-subtle)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3) var(--space-4)',
              outline: 'none',
              letterSpacing: 'var(--tracking-wider)',
              boxSizing: 'border-box',
              marginBottom: 'var(--space-3)',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'text',
              transition: 'border-color var(--duration-base)',
            }}
          />

          {/* Error message */}
          {error && (
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'rgb(239,68,68)',
              letterSpacing: 'var(--tracking-wider)',
              marginBottom: 'var(--space-3)',
            }}>
              {error}
            </p>
          )}

          {/* Authenticate button */}
          <button
            type="submit"
            disabled={loading || !password}
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
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !password ? 0.5 : 1,
              marginBottom: 'var(--space-6)',
              transition: 'opacity var(--duration-base)',
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>

        {/* Footer note */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
          opacity: 0.6,
          textAlign: 'center',
        }}>
          // SESSION EXPIRES IN 7 DAYS
        </p>
      </motion.div>
    </motion.div>,
    document.body
  )
}

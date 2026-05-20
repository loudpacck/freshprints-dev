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

function ShieldBodyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L4 6v6c0 5.25 3.5 9.5 8 10.5C16.5 21.5 20 17.25 20 12V6L12 3z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const inputStyle = {
  width: '100%',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-3) var(--space-4)',
  outline: 'none',
  letterSpacing: 'var(--tracking-wider)',
  boxSizing: 'border-box',
  marginBottom: 'var(--space-3)',
  transition: 'border-color var(--duration-base)',
}

const AMBER = '#C9A961'

export default function ModeratorLoginModal({ onClose }) {
  const { play } = useSound()
  const navigate  = useNavigate()
  const [mode, setMode]       = useState('login') // 'login' | 'activate'
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Login fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Activate fields
  const [token, setToken]         = useState('')
  const [newUsername, setNewUser] = useState('')
  const [newPassword, setNewPass] = useState('')

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

  function switchMode(m) {
    setMode(m)
    setError(null)
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!username || !password || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/moderator?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        play('success')
        onClose()
        navigate('/admin')
      } else {
        const d = await res.json()
        play('error')
        setError(d.error || '// ACCESS DENIED')
        setPassword('')
      }
    } catch {
      play('error')
      setError('// CONNECTION ERROR')
    } finally {
      setLoading(false)
    }
  }

  async function handleActivate(e) {
    e.preventDefault()
    if (!token || !newUsername || !newPassword || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/moderator?action=activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username: newUsername, password: newPassword }),
      })
      const d = await res.json()
      if (res.ok) {
        play('success')
        onClose()
        navigate('/admin')
      } else {
        play('error')
        setError(d.message || d.error || '// ACTIVATION FAILED')
        setToken('')
      }
    } catch {
      play('error')
      setError('// CONNECTION ERROR')
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
          maxWidth: 440,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={() => { play('modalClose'); onClose() }}
          aria-label="Close moderator modal"
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

        {/* Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          background: `rgba(201,169,97,0.1)`,
          border: `1px solid rgba(201,169,97,0.25)`,
          color: AMBER,
          marginBottom: 'var(--space-6)',
        }}>
          <ShieldBodyIcon />
        </div>

        {/* Eyebrow */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: AMBER,
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-2)',
        }}>
          // MODERATOR ACCESS
        </p>

        {/* Heading */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--tracking-wide)',
          marginBottom: 'var(--space-3)',
        }}>
          {mode === 'login' ? 'MODERATOR LOGIN' : 'ACTIVATE ACCOUNT'}
        </h2>

        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          lineHeight: 'var(--leading-relaxed)',
          marginBottom: 'var(--space-6)',
        }}>
          {mode === 'login'
            ? 'Enter your moderator credentials to continue.'
            : 'Enter your invite token and choose a username and password.'}
        </p>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="USERNAME"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              disabled={loading}
              style={{ ...inputStyle, borderColor: error ? 'rgba(239,68,68,0.5)' : 'var(--color-border-subtle)' }}
            />
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              style={{ ...inputStyle, borderColor: error ? 'rgba(239,68,68,0.5)' : 'var(--color-border-subtle)' }}
            />
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
            <button
              type="submit"
              disabled={loading || !username || !password}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                color: '#0A0A0F',
                background: (loading || !username || !password) ? 'rgba(201,169,97,0.35)' : AMBER,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3) var(--space-4)',
                cursor: (loading || !username || !password) ? 'not-allowed' : 'pointer',
                marginBottom: 'var(--space-4)',
                transition: 'opacity var(--duration-base)',
              }}
            >
              {loading ? 'AUTHENTICATING...' : 'LOGIN'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleActivate}>
            <input
              type="text"
              placeholder="INVITE TOKEN"
              value={token}
              onChange={e => setToken(e.target.value)}
              autoFocus
              disabled={loading}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
            />
            <input
              type="text"
              placeholder="CHOOSE USERNAME"
              value={newUsername}
              onChange={e => setNewUser(e.target.value)}
              disabled={loading}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="CHOOSE PASSWORD (min 8 chars)"
              value={newPassword}
              onChange={e => setNewPass(e.target.value)}
              disabled={loading}
              style={inputStyle}
            />
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
            <button
              type="submit"
              disabled={loading || !token || !newUsername || !newPassword}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                color: '#0A0A0F',
                background: (loading || !token || !newUsername || !newPassword) ? 'rgba(201,169,97,0.35)' : AMBER,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3) var(--space-4)',
                cursor: (loading || !token || !newUsername || !newPassword) ? 'not-allowed' : 'pointer',
                marginBottom: 'var(--space-4)',
                transition: 'opacity var(--duration-base)',
              }}
            >
              {loading ? 'ACTIVATING...' : 'ACTIVATE ACCOUNT'}
            </button>
          </form>
        )}

        {/* Mode toggle */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          letterSpacing: 'var(--tracking-wider)',
          textAlign: 'center',
        }}>
          {mode === 'login' ? (
            <>
              Have an invite?{' '}
              <button
                onClick={() => switchMode('activate')}
                style={{ background: 'none', border: 'none', color: AMBER, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase' }}
              >
                Activate account
              </button>
            </>
          ) : (
            <>
              Already activated?{' '}
              <button
                onClick={() => switchMode('login')}
                style={{ background: 'none', border: 'none', color: AMBER, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase' }}
              >
                Log in
              </button>
            </>
          )}
        </p>
      </motion.div>
    </motion.div>,
    document.body
  )
}

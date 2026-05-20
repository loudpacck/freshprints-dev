import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const INPUT_BASE = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '13px 16px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  color: '#F0F0F8',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 150ms ease',
}

const LABEL = {
  display: 'block',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: 'rgba(240,240,248,0.45)',
  marginBottom: 7,
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy]   = useState(false)
  const [done, setDone]   = useState(false)
  const [error, setError] = useState('')

  function onFocus(e) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }
  function onBlur(e)  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res  = await fetch('/api/auth/reset?action=request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setError(data.message || 'Too many requests. Try again tomorrow.')
        return
      }
      // Always show success — never reveal if email exists
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <style>{`.pw-fp-input::placeholder { color: rgba(240,240,248,0.25); }`}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          minHeight: '100vh',
          background: '#07070D',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.09) 0%, transparent 55%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          fontFamily: "'DM Sans', sans-serif",
          color: '#F0F0F8',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>

          <Link
            to="/games/pantheon-wars/login"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.1em',
              color: 'rgba(240,240,248,0.35)',
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: 44,
              transition: 'color 120ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(240,240,248,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,240,248,0.35)'}
          >
            ← Back to login
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center', marginBottom: 44 }}
          >
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.22em',
              color: 'rgba(240,240,248,0.28)',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              ⚔ &nbsp; PANTHEON WARS &nbsp; ⚔
            </p>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(34px, 9vw, 52px)',
              letterSpacing: '0.07em',
              color: '#F0F0F8',
              margin: '0 0 10px',
              lineHeight: 1,
            }}>
              Recover Your Legend
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: 'rgba(240,240,248,0.42)',
              margin: 0,
            }}>
              Enter your email to receive a reset link.
            </p>
          </motion.div>

          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '32px 24px',
                textAlign: 'center',
              }}
            >
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                letterSpacing: '0.12em',
                color: '#22C55E',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}>
                // SENT
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: 'rgba(240,240,248,0.7)',
                lineHeight: 1.6,
                margin: '0 0 20px',
              }}>
                If that email is registered, you&apos;ll receive a reset link shortly. Check your inbox.
              </p>
              <Link
                to="/games/pantheon-wars/login"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  color: '#F5C542',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Return to login →
              </Link>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '28px 24px',
                marginBottom: 16,
              }}>
                <label style={LABEL} htmlFor="fp-email">Email address</label>
                <input
                  id="fp-email"
                  className="pw-fp-input"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  style={INPUT_BASE}
                />
              </div>

              {error && (
                <motion.p
                  key={error}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    color: '#F87171',
                    textAlign: 'center',
                    marginBottom: 14,
                  }}
                >
                  // {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={busy}
                style={{
                  width: '100%',
                  padding: '15px 24px',
                  background: busy
                    ? 'rgba(245,197,66,0.28)'
                    : 'linear-gradient(135deg, #F5C542 0%, #E8943A 100%)',
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 22,
                  letterSpacing: '0.1em',
                  color: busy ? 'rgba(7,7,13,0.45)' : '#07070D',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  transition: 'opacity 150ms',
                  marginBottom: 20,
                }}
              >
                {busy ? 'SENDING...' : 'SEND RESET LINK'}
              </button>

              <p style={{
                textAlign: 'center',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: 'rgba(240,240,248,0.38)',
                margin: 0,
              }}>
                Remember your password?{' '}
                <Link
                  to="/games/pantheon-wars/login"
                  style={{ color: '#F5C542', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  Sign in
                </Link>
              </p>
            </motion.form>
          )}

        </div>
      </motion.div>
    </>
  )
}

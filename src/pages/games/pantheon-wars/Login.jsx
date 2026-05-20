import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

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

export default function PantheonLogin() {
  const navigate = useNavigate()
  const { refresh } = usePantheonWars()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  function onFocus(e) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }
  function onBlur(e)  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res  = await fetch('/api/games/pantheon-wars/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed. Please try again.'); return }
      await refresh()
      navigate('/games/pantheon-wars')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <style>{`
        .pw-login-input::placeholder { color: rgba(240,240,248,0.25); }
      `}</style>

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

          {/* Back link */}
          <Link
            to="/home"
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
            ← freshprints.dev
          </Link>

          {/* Header */}
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
              fontSize: 'clamp(38px, 10vw, 60px)',
              letterSpacing: '0.07em',
              color: '#F0F0F8',
              margin: '0 0 10px',
              lineHeight: 1,
            }}>
              Enter Your Legend
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: 'rgba(240,240,248,0.42)',
              margin: 0,
            }}>
              The war continues. Claim your place.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Card surface */}
            <div style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '28px 24px',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={LABEL} htmlFor="pw-login-email">Email</label>
                  <input
                    id="pw-login-email"
                    className="pw-login-input"
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
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <label style={{ ...LABEL, marginBottom: 0 }} htmlFor="pw-login-password">Password</label>
                    <Link
                      to="/games/pantheon-wars/forgot-password"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.1em',
                        color: 'rgba(240,240,248,0.32)',
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        transition: 'color 120ms',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#F5C542'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,240,248,0.32)'}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="pw-login-password"
                    className="pw-login-input"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    style={INPUT_BASE}
                  />
                </div>
              </div>
            </div>

            {/* Error */}
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

            {/* Submit */}
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
              {busy ? 'AUTHENTICATING...' : 'ENTER THE PANTHEON'}
            </button>

            <p style={{
              textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: 'rgba(240,240,248,0.38)',
              margin: 0,
            }}>
              New warrior?{' '}
              <Link
                to="/games/pantheon-wars/signup"
                style={{ color: '#F5C542', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Create your legend
              </Link>
            </p>
          </motion.form>

        </div>
      </motion.div>
    </>
  )
}

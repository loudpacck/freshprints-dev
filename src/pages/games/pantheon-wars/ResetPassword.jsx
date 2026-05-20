import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token   = params.get('token')
  const userId  = params.get('id')

  const [newPassword, setNewPassword]     = useState('')
  const [confirmPassword, setConfirm]     = useState('')
  const [busy, setBusy]                   = useState(false)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState(false)

  const invalid = !token || !userId

  function onFocus(e) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }
  function onBlur(e)  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const res  = await fetch('/api/auth/reset?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user_id: userId, new_password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Reset failed. The link may be invalid or expired.')
        return
      }
      setSuccess(true)
      setTimeout(() => navigate('/games/pantheon-wars/login'), 3000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <style>{`.pw-rp-input::placeholder { color: rgba(240,240,248,0.25); }`}</style>

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
              Set New Password
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: 'rgba(240,240,248,0.42)',
              margin: 0,
            }}>
              {invalid
                ? 'This reset link is invalid.'
                : 'Choose a new password for your account.'}
            </p>
          </motion.div>

          {invalid ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(248,113,113,0.06)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 12,
                padding: '28px 24px',
                textAlign: 'center',
              }}
            >
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.1em',
                color: '#F87171',
                marginBottom: 16,
              }}>
                // INVALID RESET LINK
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: 'rgba(240,240,248,0.55)',
                marginBottom: 20,
              }}>
                This link is missing required parameters. Request a new one.
              </p>
              <Link
                to="/games/pantheon-wars/forgot-password"
                style={{ color: '#F5C542', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}
              >
                Request new reset link →
              </Link>
            </motion.div>
          ) : success ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.2)',
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
                // PASSWORD RESET
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: 'rgba(240,240,248,0.7)',
                lineHeight: 1.6,
                margin: '0 0 8px',
              }}>
                Your password has been updated. Redirecting to login...
              </p>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: 'rgba(240,240,248,0.3)',
              }}>
                All active sessions have been revoked.
              </p>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={LABEL} htmlFor="rp-new">New Password</label>
                    <input
                      id="rp-new"
                      className="pw-rp-input"
                      type="password"
                      required
                      autoComplete="new-password"
                      autoFocus
                      minLength={8}
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      style={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label style={LABEL} htmlFor="rp-confirm">Confirm Password</label>
                    <input
                      id="rp-confirm"
                      className="pw-rp-input"
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={e => setConfirm(e.target.value)}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      style={INPUT_BASE}
                    />
                  </div>
                </div>
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
                {busy ? 'UPDATING...' : 'RESET PASSWORD'}
              </button>

              <p style={{
                textAlign: 'center',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: 'rgba(240,240,248,0.38)',
                margin: 0,
              }}>
                <Link
                  to="/games/pantheon-wars/forgot-password"
                  style={{ color: 'rgba(240,240,248,0.38)', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(240,240,248,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,240,248,0.38)'}
                >
                  Request a new link
                </Link>
              </p>
            </motion.form>
          )}

        </div>
      </motion.div>
    </>
  )
}

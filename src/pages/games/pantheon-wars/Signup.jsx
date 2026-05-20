import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// ─── Data ────────────────────────────────────────────────────────────────────

const FACTIONS = [
  {
    id: 'olympians',
    label: 'Olympians',
    myth: 'Greek mythology',
    bonus: '+5% XP from quests',
    color: '#F5C542',
    glyph: '⚡',
  },
  {
    id: 'aesir',
    label: 'Aesir',
    myth: 'Norse mythology',
    bonus: '+5% Attack power',
    color: '#78C5F0',
    glyph: '❄',
  },
  {
    id: 'annunaki',
    label: 'Annunaki',
    myth: 'Mesopotamian',
    bonus: '+5% Drachma earned',
    color: '#CF4444',
    glyph: '✦',
  },
]

const CLASSES = [
  {
    id: 'warden',
    label: 'Warden',
    role: 'Tank · Defender',
    stat: 'Defense',
    desc: 'Absorbs punishment and outlasts any opponent in prolonged combat.',
  },
  {
    id: 'oracle',
    label: 'Oracle',
    role: 'Support · Utility',
    stat: 'Energy max + regen',
    desc: 'Completes more quests with expanded foresight and energy capacity.',
  },
  {
    id: 'slayer',
    label: 'Slayer',
    role: 'Offense · DPS',
    stat: 'Attack',
    desc: 'Dominates PvP with pure destructive force and combat aggression.',
  },
  {
    id: 'broker',
    label: 'Broker',
    role: 'Economy · Income',
    stat: 'Drachma multiplier',
    desc: 'Turns every quest into profit. Wealth is its own kind of power.',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FactionCard({ faction, selected, onSelect }) {
  const rgb = hexRgb(faction.color)
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      aria-pressed={selected}
      style={{
        background: selected
          ? `rgba(${rgb}, 0.1)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? faction.color : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 10,
        padding: '16px 10px 14px',
        cursor: 'pointer',
        textAlign: 'center',
        boxShadow: selected ? `0 0 20px rgba(${rgb}, 0.2)` : 'none',
        transition: 'background 150ms, border-color 150ms, box-shadow 150ms',
        color: '#F0F0F8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <span style={{ fontSize: 24, lineHeight: 1 }}>{faction.glyph}</span>
      <span style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 17,
        letterSpacing: '0.07em',
        color: selected ? faction.color : '#F0F0F8',
        lineHeight: 1,
      }}>
        {faction.label}
      </span>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.08em',
        color: 'rgba(240,240,248,0.38)',
        textTransform: 'uppercase',
      }}>
        {faction.myth}
      </span>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.06em',
        color: selected ? faction.color : 'rgba(240,240,248,0.32)',
        textTransform: 'uppercase',
        marginTop: 2,
      }}>
        {faction.bonus}
      </span>
    </motion.button>
  )
}

function ClassCard({ cls, selected, onSelect }) {
  const CYAN = '#00C8FF'
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      aria-pressed={selected}
      style={{
        background: selected ? 'rgba(0,200,255,0.07)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? CYAN : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 10,
        padding: '16px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: selected ? '0 0 18px rgba(0,200,255,0.14)' : 'none',
        transition: 'background 150ms, border-color 150ms, box-shadow 150ms',
        color: '#F0F0F8',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 20,
        letterSpacing: '0.07em',
        color: selected ? CYAN : '#F0F0F8',
        lineHeight: 1,
      }}>
        {cls.label}
      </span>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.09em',
        color: 'rgba(240,240,248,0.38)',
        textTransform: 'uppercase',
      }}>
        {cls.role}
      </span>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        color: 'rgba(240,240,248,0.52)',
        lineHeight: 1.5,
        marginTop: 4,
      }}>
        {cls.desc}
      </span>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.08em',
        color: selected ? CYAN : 'rgba(240,240,248,0.28)',
        textTransform: 'uppercase',
        marginTop: 4,
      }}>
        Primary: {cls.stat}
      </span>
    </motion.button>
  )
}

// ─── Security questions ───────────────────────────────────────────────────────

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your childhood best friend?",
  "What was the make of your first car?",
  "What street did you grow up on?",
]

// ─── Page ─────────────────────────────────────────────────────────────────────

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

const SECTION_HEAD = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: 'rgba(240,240,248,0.35)',
  marginBottom: 14,
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }

export default function PantheonSignup() {
  const navigate  = useNavigate()
  const [fields, setFields]   = useState({ username: '', email: '', password: '', security_question: SECURITY_QUESTIONS[0], security_answer: '' })
  const [faction, setFaction] = useState(null)
  const [cls, setCls]         = useState(null)
  const [error, setError]     = useState('')
  const [busy, setBusy]       = useState(false)

  function field(key) {
    return e => setFields(f => ({ ...f, [key]: e.target.value }))
  }

  function onFocus(e) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }
  function onBlur(e)  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!faction) { setError('Choose a faction to continue.'); return }
    if (!cls)     { setError('Choose a class to continue.'); return }
    if (!fields.security_answer.trim() || fields.security_answer.trim().length < 3) {
      setError('Security answer must be at least 3 characters.')
      return
    }
    setBusy(true)
    try {
      const res  = await fetch('/api/games/pantheon-wars/auth?action=signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, faction, class: cls }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Signup failed. Please try again.'); return }
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
        .pw-input::placeholder { color: rgba(240,240,248,0.25); }
        @media (max-width: 420px) {
          .pw-faction-grid { grid-template-columns: 1fr !important; }
          .pw-class-grid   { grid-template-columns: 1fr !important; }
        }
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
          overflowY: 'auto',
          padding: '28px 20px 72px',
          fontFamily: "'DM Sans', sans-serif",
          color: '#F0F0F8',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto' }}>

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
            style={{ textAlign: 'center', marginBottom: 52 }}
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
              fontSize: 'clamp(38px, 9vw, 60px)',
              letterSpacing: '0.07em',
              color: '#F0F0F8',
              margin: '0 0 10px',
              lineHeight: 1,
            }}>
              Create Your Legend
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: 'rgba(240,240,248,0.42)',
              margin: 0,
            }}>
              Choose your allegiance. The divine conflict awaits.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit}>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
            >

              {/* ── Section 1: Account ─────────────────────────────── */}
              <motion.section variants={fadeUp} style={{ marginBottom: 40 }}>
                <p style={SECTION_HEAD}>// Account</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={LABEL} htmlFor="pw-username">Username</label>
                    <input
                      id="pw-username"
                      className="pw-input"
                      type="text"
                      required
                      autoComplete="username"
                      maxLength={30}
                      placeholder="Your name in the annals of history"
                      value={fields.username}
                      onChange={field('username')}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      style={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label style={LABEL} htmlFor="pw-email">Email</label>
                    <input
                      id="pw-email"
                      className="pw-input"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={fields.email}
                      onChange={field('email')}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      style={INPUT_BASE}
                    />
                  </div>
                  <div>
                    <label style={LABEL} htmlFor="pw-password">Password</label>
                    <input
                      id="pw-password"
                      className="pw-input"
                      type="password"
                      required
                      autoComplete="new-password"
                      minLength={8}
                      placeholder="Min 8 characters"
                      value={fields.password}
                      onChange={field('password')}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      style={INPUT_BASE}
                    />
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <p style={{ ...LABEL, marginBottom: 12, color: 'rgba(240,240,248,0.35)' }}>
                      // Security Recovery
                    </p>
                    <div style={{ marginBottom: 12 }}>
                      <label style={LABEL} htmlFor="pw-sec-q">Security Question</label>
                      <select
                        id="pw-sec-q"
                        required
                        value={fields.security_question}
                        onChange={field('security_question')}
                        style={{
                          ...INPUT_BASE,
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {SECURITY_QUESTIONS.map(q => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={LABEL} htmlFor="pw-sec-a">Your Answer</label>
                      <input
                        id="pw-sec-a"
                        className="pw-input"
                        type="text"
                        required
                        autoComplete="off"
                        placeholder="Your answer (visible)"
                        value={fields.security_answer}
                        onChange={field('security_answer')}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        style={INPUT_BASE}
                      />
                    </div>
                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      color: 'rgba(240,240,248,0.28)',
                      textTransform: 'uppercase',
                      marginTop: 8,
                    }}>
                      Used to recover your account if you forget your email.
                    </p>
                  </div>
                </div>
              </motion.section>

              <motion.div variants={fadeUp}>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 40 }} />
              </motion.div>

              {/* ── Section 2: Faction ─────────────────────────────── */}
              <motion.section variants={fadeUp} style={{ marginBottom: 40 }}>
                <p style={SECTION_HEAD}>// Choose Your Faction</p>
                <div
                  className="pw-faction-grid"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}
                >
                  {FACTIONS.map(f => (
                    <FactionCard
                      key={f.id}
                      faction={f}
                      selected={faction === f.id}
                      onSelect={() => setFaction(f.id)}
                    />
                  ))}
                </div>
                {faction && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      color: 'rgba(240,240,248,0.35)',
                      textTransform: 'uppercase',
                      marginTop: 10,
                      textAlign: 'center',
                    }}
                  >
                    // Faction is permanent — choose wisely
                  </motion.p>
                )}
              </motion.section>

              <motion.div variants={fadeUp}>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 40 }} />
              </motion.div>

              {/* ── Section 3: Class ───────────────────────────────── */}
              <motion.section variants={fadeUp} style={{ marginBottom: 40 }}>
                <p style={SECTION_HEAD}>// Choose Your Class</p>
                <div
                  className="pw-class-grid"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}
                >
                  {CLASSES.map(c => (
                    <ClassCard
                      key={c.id}
                      cls={c}
                      selected={cls === c.id}
                      onSelect={() => setCls(c.id)}
                    />
                  ))}
                </div>
              </motion.section>

              {/* ── Error + Submit ─────────────────────────────────── */}
              <motion.div variants={fadeUp}>
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
                      marginBottom: 16,
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
                  }}
                >
                  {busy ? 'FORGING YOUR LEGEND...' : 'ENTER THE PANTHEON'}
                </button>

                <p style={{
                  textAlign: 'center',
                  marginTop: 24,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: 'rgba(240,240,248,0.38)',
                }}>
                  Already a warrior?{' '}
                  <Link
                    to="/games/pantheon-wars/login"
                    style={{ color: '#F5C542', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>

            </motion.div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

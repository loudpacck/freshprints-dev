import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import { useTheme } from '@/themes/useTheme'
import { useSound } from '@/sound/useSound'
import { themes, themeIds } from '@/themes/registry'

function getThemeHome(id) {
  if (id === 'digital') return '/hub'
  if (id === 'standard') return '/home'
  if (id === 'funky') return '/home'
  return '/'
}

const THEME_ACCENTS = {
  digital: '#00C8FF',
  pantheon: '#FFB347',
  standard: '#A0A0B8',
  funky: '#8B5CF6',
}

function StatusPill({ label, color }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.65rem',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wider)',
      color,
      border: `1px solid ${color}`,
      borderRadius: 'var(--radius-full)',
      padding: '2px 8px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

function getStatusInfo(theme, activeId) {
  if (theme.id === activeId) return { label: 'ACTIVE', color: '#00C8FF' }
  if (theme.comingSoon) return { label: 'COMING SOON', color: '#C9A961' }
  if (theme.status === 'complete') return { label: 'AVAILABLE', color: '#22C55E' }
  if (theme.hidden) return { label: 'LOCKED', color: '#50505F' }
  return { label: 'COMING SOON', color: '#F59E0B' }
}

function ThemeCard({ theme, isActive, isShaken, onClick }) {
  const accent = THEME_ACCENTS[theme.id] || '#00C8FF'
  const status = getStatusInfo(theme, isActive ? theme.id : '')
  const canSelect = theme.status === 'complete' && !theme.comingSoon && !isActive

  return (
    <motion.div
      animate={isShaken ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card
        hoverable={!isActive && !theme.comingSoon}
        accentColor={accent}
        onClick={onClick}
        style={{
          opacity: theme.comingSoon ? 0.55 : (theme.status !== 'complete' || isActive) ? (isActive ? 1 : 0.72) : 1,
          height: '100%',
          cursor: theme.comingSoon ? 'default' : undefined,
        }}
      >
        {/* Palette swatches */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-4)' }}>
          {(theme.palette || []).map((color, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: color,
                border: '1px solid rgba(255,255,255,0.10)',
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Name */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-3xl)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--tracking-wide)',
          marginBottom: 'var(--space-1)',
          lineHeight: 1,
        }}>
          {theme.label}
        </h3>

        {/* Tagline */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-2)',
        }}>
          {theme.tagline}
        </p>

        {/* Description */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-5)',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 'var(--leading-normal)',
        }}>
          {theme.description}
        </p>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <StatusPill label={status.label} color={status.color} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: canSelect ? 'var(--color-text-accent)' : 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wide)',
            whiteSpace: 'nowrap',
          }}>
            {isActive ? '// ACTIVE' : canSelect ? 'SELECT →' : 'UNAVAILABLE'}
          </span>
        </div>
      </Card>
    </motion.div>
  )
}

export default function UIPicker({ isOpen, onClose }) {
  const { themeId, mode, setTheme, toggleMode } = useTheme()
  const { play } = useSound()
  const navigate = useNavigate()
  const [shakenId, setShakenId] = useState(null)
  const [toast, setToast] = useState(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) play('modalOpen')
    if (!isOpen && wasOpenRef.current) play('modalClose')
    wasOpenRef.current = isOpen
  }, [isOpen, play])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  function handleCardClick(theme) {
    if (theme.id === themeId) return
    if (theme.comingSoon) return
    if (theme.status === 'complete') {
      play('select')
      setTheme(theme.id)
      setTimeout(() => { navigate(getThemeHome(theme.id)); onClose() }, 300)
      return
    }
    setShakenId(theme.id)
    setTimeout(() => setShakenId(null), 400)
    const msg = theme.hidden
      ? `// ${theme.label.toUpperCase()} is locked`
      : `// ${theme.label.toUpperCase()} not yet available`
    setToast(msg)
  }

  function handleSetMode(newMode) {
    if (newMode !== mode) toggleMode()
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="ui-picker-backdrop"
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
              backdropFilter: 'blur(4px)',
            }}
          />

          <motion.div
            key="ui-picker-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 'calc(var(--z-modal) + 1)',
              padding: 'var(--space-4)',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '80vh',
              overflowY: 'auto',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-8)',
              pointerEvents: 'auto',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-8)',
              }}>
                <div>
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-accent)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-widest)',
                    marginBottom: 'var(--space-2)',
                  }}>
                    // SYSTEM
                  </p>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-4xl)',
                    color: 'var(--color-text-primary)',
                    letterSpacing: 'var(--tracking-wide)',
                    marginBottom: 'var(--space-2)',
                    lineHeight: 1,
                  }}>
                    CHANGE UI
                  </h2>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    Pick how this site looks and feels.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-1) var(--space-3)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    flexShrink: 0,
                    marginLeft: 'var(--space-4)',
                  }}
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Theme grid */}
              <div className="ui-picker-grid" style={{ marginBottom: 'var(--space-6)' }}>
                {themeIds.map(id => {
                  const theme = themes[id]
                  return (
                    <ThemeCard
                      key={id}
                      theme={theme}
                      isActive={id === themeId}
                      isShaken={shakenId === id}
                      onClick={() => handleCardClick(theme)}
                    />
                  )
                })}
              </div>

              {/* Mode toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-5)',
                background: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
                marginBottom: 'var(--space-5)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wider)',
                }}>
                  MODE:
                </span>
                {['dark', 'light'].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleSetMode(m)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wider)',
                      padding: 'var(--space-2) var(--space-4)',
                      borderRadius: 'var(--radius-sm)',
                      border: m === mode ? 'none' : '1px solid var(--color-border-default)',
                      background: m === mode ? 'var(--color-accent-primary)' : 'transparent',
                      color: m === mode ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--duration-base)',
                    }}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Toast */}
              <AnimatePresence>
                {toast && (
                  <motion.p
                    key="toast"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-status-beta)',
                      textAlign: 'center',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    {toast}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Footer */}
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
              }}>
                // Your choice persists across sessions. URL params (?theme=, ?mode=) override this.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

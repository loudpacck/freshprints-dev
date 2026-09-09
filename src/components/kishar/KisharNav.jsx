import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useSound } from '@/sound/useSound'
import { PRIMARY_NAV } from '@/data/navigation'

/**
 * A gilded band: royal purple, leather grain behind it, a beveled gold rule
 * (one gold-bright pixel over one gold-dim pixel) top and bottom.
 *
 * Links come from PRIMARY_NAV, keyed on `id`. No label or href is written here.
 */

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function SigilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5 L14.5 8 L8 14.5 L1.5 8 Z" stroke="currentColor" strokeWidth="1.1" />
      <path d="M8 5 L11 8 L8 11 L5 8 Z" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

export default function KisharNav({ onOpenPicker }) {
  const location = useLocation()
  const reduced = useReducedMotion()
  const { play, isMuted, toggleMute } = useSound()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/')

  // Small gilded control: metal-textured leather chip with an outset bevel.
  const iconBtn = {
    position: 'relative',
    width: 34,
    height: 34,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--binding-leather)',
    border: '1px solid var(--binding-gold-dim)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--bevel-binding-out)',
    color: 'var(--binding-gold)',
    cursor: 'pointer',
    overflow: 'hidden',
  }

  return (
    <header
      className="kishar-navband k-tex-leather"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        height: 'var(--nav-height)',
        background: 'var(--purple)',
        overflow: 'visible',
      }}
    >
      {/* Beveled gold rules — structural, not decoration hung on top. */}
      <span className="k-rule-top" />
      <span className="k-rule-bottom" />

      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '100%',
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: '0 var(--space-8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-5)',
      }}>
        {/* Wordmark */}
        <Link
          to="/home"
          onMouseEnter={() => play('hover')}
          onClick={() => play('click')}
          style={{ textDecoration: 'none', flexShrink: 0, lineHeight: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
        >
          <span style={{ color: 'var(--binding-gold)', display: 'flex' }}><SigilIcon /></span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--text-xl)',
            letterSpacing: 'var(--tracking-wider)',
            color: 'var(--binding-ink)',
          }}>
            Fresh Prints
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="kishar-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
          {PRIMARY_NAV.map(({ id, label, href }) => (
            <Link
              key={id}
              to={href}
              className={`kishar-navlink${isActive(href) ? ' active' : ''}`}
              onMouseEnter={() => play('hover')}
              onClick={() => play('click')}
            >
              {label}
            </Link>
          ))}

          <button
            onClick={() => toggleMute()}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="k-tex-metal"
            style={{ ...iconBtn, marginLeft: 'var(--space-2)', fontSize: 13 }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>{isMuted ? '🔇' : '🔊'}</span>
          </button>
          <button
            onClick={() => { play('click'); onOpenPicker?.() }}
            aria-label="Switch interface"
            title="Switch interface"
            className="k-tex-metal"
            style={iconBtn}
          >
            <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}><SigilIcon /></span>
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="kishar-mobile-nav" style={{ display: 'none', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => { play('click'); setMenuOpen(o => !o) }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="k-tex-metal"
            style={{ ...iconBtn, width: 40, height: 40 }}
          >
            <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown — same band material, same bevel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="kishar-navband k-tex-leather"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: 'var(--purple)',
              borderBottom: '2px solid var(--binding-gold-dim)',
            }}
          >
            <nav
              aria-label="Mobile navigation"
              style={{ position: 'relative', zIndex: 2, padding: 'var(--space-4) var(--space-5) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}
            >
              {PRIMARY_NAV.map(({ id, label, href }) => (
                <Link
                  key={id}
                  to={href}
                  className={`kishar-navlink${isActive(href) ? ' active' : ''}`}
                  onClick={() => play('click')}
                  style={{ minHeight: 44, display: 'flex', alignItems: 'center', fontSize: 'var(--text-lg)' }}
                >
                  {label}
                </Link>
              ))}
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                <button
                  onClick={() => { setMenuOpen(false); onOpenPicker?.() }}
                  className="kishar-btn kishar-btn--secondary"
                  style={{ flex: 1, minHeight: 44, fontSize: 'var(--text-base)' }}
                >
                  Switch Interface
                </button>
                <button
                  onClick={() => toggleMute()}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="kishar-btn kishar-btn--secondary"
                  style={{ minHeight: 44, width: 52 }}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 768px) {
          [data-ui="kishar"] .kishar-desktop-nav { display: flex !important; }
          [data-ui="kishar"] .kishar-mobile-nav  { display: none !important; }
        }
        @media (max-width: 767px) {
          [data-ui="kishar"] .kishar-desktop-nav { display: none !important; }
          [data-ui="kishar"] .kishar-mobile-nav  { display: flex !important; }
        }
      `}</style>
    </header>
  )
}

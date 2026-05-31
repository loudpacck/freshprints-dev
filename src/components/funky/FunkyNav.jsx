import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useSound } from '@/sound/useSound'

// Full page parity — all 8 tabs, including Skills.
const NAV_LINKS = [
  { to: '/about',     label: 'About' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/skills',    label: 'Skills' },
  { to: '/services',  label: 'Services' },
  { to: '/lab',       label: 'Lab' },
  { to: '/store',     label: 'Store' },
  { to: '/media',     label: 'Media' },
  { to: '/contact',   label: 'Contact' },
]

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

export default function FunkyNav({ onOpenPicker }) {
  const location = useLocation()
  const reduced = useReducedMotion()
  const { play, isMuted, toggleMute } = useSound()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 60) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/')

  const iconBtn = {
    background: 'var(--accent-muted)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-full)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    flexShrink: 0,
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        height: 'var(--nav-height)',
        background: scrolled ? 'var(--bg-overlay)' : 'transparent',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid',
        borderColor: scrolled ? 'var(--border-subtle)' : 'transparent',
        transition: 'background var(--duration-fast) var(--ease-smooth), border-color var(--duration-fast) var(--ease-smooth)',
      }}
    >
      <div style={{
        height: '100%',
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: '0 var(--space-8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-5)',
      }}>
        {/* Logo */}
        <Link to="/home" style={{ textDecoration: 'none', flexShrink: 0, lineHeight: 1 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--text-xl)',
            background: 'var(--gradient-text)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'var(--accent)',
            letterSpacing: 'var(--tracking-tight)',
          }}>
            Fresh Prints
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="funky-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`funky-pill${isActive(to) ? ' active' : ''}`}
              onMouseEnter={() => play('hover')}
              onClick={() => play('click')}
              style={{ textDecoration: 'none', fontSize: 'var(--text-sm)' }}
            >
              {label}
            </Link>
          ))}

          <button onClick={() => toggleMute()} aria-label={isMuted ? 'Unmute' : 'Mute'} title={isMuted ? 'Unmute' : 'Mute'} style={{ ...iconBtn, marginLeft: 'var(--space-2)' }}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button onClick={() => { play('click'); onOpenPicker?.() }} aria-label="Switch interface" title="Switch interface" style={iconBtn}>
            <GridIcon />
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="funky-mobile-nav" style={{ display: 'none', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button onClick={() => toggleMute()} aria-label={isMuted ? 'Unmute' : 'Mute'} style={iconBtn}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => { play('click'); setMenuOpen(o => !o) }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            style={{ ...iconBtn, color: 'var(--text-primary)' }}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.28, ease: [0.45, 0, 0.15, 1] }}
            style={{
              overflow: 'hidden',
              background: 'var(--bg-overlay)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <nav aria-label="Mobile navigation" style={{ padding: 'var(--space-3) var(--space-5) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`funky-pill${isActive(to) ? ' active' : ''}`}
                  onClick={() => play('click')}
                  style={{ textDecoration: 'none', textAlign: 'left', minHeight: 44, display: 'flex', alignItems: 'center', fontSize: 'var(--text-base)' }}
                >
                  {label}
                </Link>
              ))}
              <button
                onClick={() => { setMenuOpen(false); onOpenPicker?.() }}
                className="funky-pill"
                style={{ textAlign: 'left', minHeight: 44, display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-base)' }}
              >
                <GridIcon /> Switch Interface
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 768px) {
          [data-ui="funky"] .funky-desktop-nav { display: flex !important; }
          [data-ui="funky"] .funky-mobile-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          [data-ui="funky"] .funky-desktop-nav { display: none !important; }
          [data-ui="funky"] .funky-mobile-nav { display: flex !important; }
        }
      `}</style>
    </header>
  )
}

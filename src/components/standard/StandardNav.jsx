import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/themes/useTheme'
import useReducedMotion from '@/hooks/useReducedMotion'

const NAV_LINKS = [
  { to: '/portfolio', label: 'Work' },
  { to: '/services',  label: 'Services' },
  { to: '/about',     label: 'About' },
  { to: '/contact',   label: 'Contact' },
]

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

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
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

export default function StandardNav({ onOpenPicker }) {
  const { mode, toggleMode } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 80) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/')

  const navBg = scrolled
    ? mode === 'dark'
      ? 'rgba(11, 11, 16, 0.97)'
      : 'rgba(250, 250, 250, 0.97)'
    : 'var(--bg-overlay)'

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 'var(--nav-height)',
        background: navBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background 250ms ease, padding 250ms ease',
      }}
    >
      <div
        className="s-container"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-6)',
          maxWidth: 'var(--container-max)',
          margin: '0 auto',
          padding: '0 var(--space-8)',
        }}
      >
        {/* Logo */}
        <Link
          to="/home"
          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}
        >
          <span style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--weight-semibold)',
            fontSize: 'var(--text-base)',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>
            Kyle DeBord
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.06em',
          }}>
            Fresh Prints
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Main navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-6)',
          }}
          className="s-desktop-nav"
        >
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`s-nav-link${isActive(to) ? ' active' : ''}`}
            >
              {label}
            </Link>
          ))}

          {/* Mode toggle */}
          <button
            onClick={toggleMode}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              background: 'none',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              transition: 'color 200ms, border-color 200ms',
              flexShrink: 0,
            }}
          >
            {mode === 'dark' ? <MoonIcon /> : <SunIcon />}
          </button>

          {/* UI picker */}
          <button
            onClick={onOpenPicker}
            aria-label="Switch interface"
            title="Switch interface"
            style={{
              background: 'none',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              transition: 'color 200ms, border-color 200ms',
              flexShrink: 0,
            }}
          >
            <GridIcon />
          </button>
        </nav>

        {/* Mobile: mode + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }} className="s-mobile-nav">
          <button
            onClick={toggleMode}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              background: 'none',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}
          >
            {mode === 'dark' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            style={{
              background: 'none',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
            }}
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
            transition={reduced ? { duration: 0 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              overflow: 'hidden',
              background: 'var(--bg-overlay)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <nav aria-label="Mobile navigation">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 var(--space-6)',
                    minHeight: 52,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 'var(--weight-medium)',
                    fontSize: 'var(--text-base)',
                    color: isActive(to) ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'color 150ms',
                  }}
                >
                  {label}
                </Link>
              ))}
              <button
                onClick={() => { setMenuOpen(false); onOpenPicker() }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  width: '100%',
                  padding: '0 var(--space-6)',
                  minHeight: 52,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 'var(--weight-medium)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <GridIcon />
                Switch Interface
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS to show/hide desktop vs mobile nav */}
      <style>{`
        @media (min-width: 768px) {
          .s-desktop-nav { display: flex !important; }
          .s-mobile-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          .s-desktop-nav { display: none !important; }
          .s-mobile-nav { display: flex !important; }
        }
      `}</style>
    </header>
  )
}

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSound } from '@/sound/useSound'

const NAV_ITEMS = [
  { label: 'Work',     href: '/portfolio' },
  { label: 'Services', href: '/services' },
  { label: 'About',    href: '/about' },
  { label: 'Contact',  href: '/contact' },
  null, // separator
  { label: 'Lab',      href: '/lab' },
  { label: 'Store',    href: '/store' },
  { label: 'Media',    href: '/media' },
]

const RAISED_SM = `
  inset 1px 1px 0 var(--bevel-highlight),
  inset -1px -1px 0 var(--bevel-dark),
  inset 2px 2px 0 var(--bevel-light),
  inset -2px -2px 0 var(--bevel-shadow)
`.trim()

export default function RetroToolbar({ onOpenPicker }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { play } = useSound()
  const [mobileOpen, setMobileOpen] = useState(false)

  function go(href) {
    play('click')
    navigate(href)
    setMobileOpen(false)
  }

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, userSelect: 'none' }}>
      {/* Title bar */}
      <div style={{
        height: 24,
        padding: '0 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: `linear-gradient(to right, var(--titlebar-active-start), var(--titlebar-active-end))`,
      }}>
        {/* Left: icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 14,
            height: 14,
            background: '#FFFF00',
            border: '1px solid rgba(255,255,255,0.4)',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 700,
            color: '#FFFFFF',
          }}>
            Fresh Prints — Kyle DeBord
          </span>
        </div>

        {/* Right: cosmetic window buttons */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            { label: '─', title: 'Minimize' },
            { label: '□', title: 'Maximize' },
            { label: '✕', title: 'Close',  onClick: () => play('error') },
          ].map(btn => (
            <button
              key={btn.title}
              title={btn.title}
              onClick={btn.onClick}
              style={{
                width: 16,
                height: 14,
                padding: 0,
                border: 'none',
                background: 'var(--bg-elevated)',
                boxShadow: RAISED_SM,
                fontFamily: 'var(--font-body)',
                fontSize: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
              onMouseDown={e => {
                e.currentTarget.style.boxShadow = RAISED_SM.replace(/highlight/g, 'dark').replace(/dark/g, 'highlight')
                e.currentTarget.style.transform = 'translate(1px,1px)'
              }}
              onMouseUp={e => {
                e.currentTarget.style.boxShadow = RAISED_SM
                e.currentTarget.style.transform = ''
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = RAISED_SM
                e.currentTarget.style.transform = ''
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu bar — desktop */}
      <div style={{
        height: 24,
        padding: '0 2px',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-elevated)',
        borderBottom: '2px solid var(--bevel-shadow)',
      }}>
        {/* Hamburger on mobile */}
        <button
          className="retro-hamburger"
          onClick={() => { play('click'); setMobileOpen(o => !o) }}
          aria-label="Menu"
          style={{
            display: 'none',
            background: 'var(--bg-elevated)',
            border: 'none',
            boxShadow: RAISED_SM,
            padding: '2px 6px',
            cursor: 'pointer',
            marginLeft: 2,
          }}
        >
          <span style={{ display: 'block', width: 14, height: 2, background: '#000', margin: '2px 0' }} />
          <span style={{ display: 'block', width: 14, height: 2, background: '#000', margin: '2px 0' }} />
          <span style={{ display: 'block', width: 14, height: 2, background: '#000', margin: '2px 0' }} />
        </button>

        {/* Desktop nav items */}
        <div className="retro-menubar-items" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {NAV_ITEMS.map((item, i) => {
            if (item === null) {
              return (
                <div key={`sep-${i}`} style={{
                  width: 1,
                  height: 16,
                  background: 'var(--bevel-shadow)',
                  margin: '0 2px',
                }} />
              )
            }
            const active = location.pathname.startsWith(item.href)
            return (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                style={{
                  padding: '2px 8px',
                  background: active ? 'var(--accent)' : 'transparent',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: active ? 'var(--accent-text)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  height: '100%',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--accent)'
                    e.currentTarget.style.color = 'var(--accent-text)'
                  }
                  play('hover')
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
              >
                {item.label}
              </button>
            )
          })}

          {/* UI picker button */}
          <div style={{
            width: 1,
            height: 16,
            background: 'var(--bevel-shadow)',
            margin: '0 2px',
          }} />
          <button
            onClick={() => { play('click'); onOpenPicker?.() }}
            style={{
              padding: '2px 8px',
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              height: '100%',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent)'
              e.currentTarget.style.color = 'var(--accent-text)'
              play('hover')
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
          >
            UI ▾
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              overflow: 'hidden',
              background: 'var(--bg-elevated)',
              borderBottom: '2px solid var(--bevel-shadow)',
            }}
          >
            {NAV_ITEMS.filter(Boolean).map(item => (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  textAlign: 'left',
                  background: location.pathname.startsWith(item.href) ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: 'none',
                  borderBottom: '1px solid var(--bevel-shadow)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: location.pathname.startsWith(item.href) ? '#FFFFFF' : 'var(--text-primary)',
                  cursor: 'pointer',
                  boxShadow: RAISED_SM,
                  minHeight: 44,
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { play('click'); onOpenPicker?.(); setMobileOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                textAlign: 'left',
                background: 'var(--bg-elevated)',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              Switch UI
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .retro-hamburger { display: flex !important; flex-direction: column; justify-content: center; }
          .retro-menubar-items { display: none !important; }
        }
      `}</style>
    </div>
  )
}

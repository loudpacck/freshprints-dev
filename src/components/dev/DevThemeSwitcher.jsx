import { useEffect, useState } from 'react'
import { useTheme } from '@/themes/useTheme'
import { getAvailableThemes, getTheme } from '@/themes/registry'

export default function DevThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { themeId, mode, setTheme, toggleMode } = useTheme()

  useEffect(() => {
    if (!import.meta.env.DEV) return
    function handler(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setIsOpen(o => !o)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!import.meta.env.DEV || !isOpen) return null

  const availableIds = getAvailableThemes()

  return (
    <div
      role="dialog"
      aria-label="Dev theme switcher"
      style={{
        position: 'fixed',
        bottom: 'var(--space-16)',
        right: 'var(--space-6)',
        zIndex: 'var(--z-toast)',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        minWidth: 200,
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        marginBottom: 'var(--space-1)',
      }}>
        // DEV — THEME
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {availableIds.map(id => {
          const m = getTheme(id)
          const active = id === themeId
          return (
            <button
              key={id}
              onClick={() => setTheme(id)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: active
                  ? '1px solid var(--color-accent-primary)'
                  : '1px solid var(--color-border-subtle)',
                background: active
                  ? 'var(--color-accent-primary-dim)'
                  : 'transparent',
                color: active
                  ? 'var(--color-accent-primary)'
                  : 'var(--color-text-secondary)',
                cursor: m.status === 'complete' ? 'pointer' : 'not-allowed',
                opacity: m.status === 'complete' ? 1 : 0.4,
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {m.label}
              {m.status !== 'complete' && (
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                  STUB
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--space-3)',
      }}>
        <button
          onClick={toggleMode}
          style={{
            width: '100%',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wide)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          MODE: {mode.toUpperCase()}
        </button>
      </div>

      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
      }}>
        Ctrl+Shift+T · ESC closes
      </p>
    </div>
  )
}

import { useTheme } from '@/themes/useTheme'
import { getCategoryColor } from '@/utils/categoryAssets'

// Tab ids are `category` values from src/data/services.js — never service ids.
const TABS = [
  { id: 'all',         digital: 'ALL',         standard: 'All Services' },
  { id: 'engineering', digital: 'ENGINEERING', standard: 'Engineering' },
  { id: 'software',    digital: 'SOFTWARE',    standard: 'Software' },
  { id: 'games',       digital: 'GAMES',       standard: 'Games' },
  { id: 'ai',          digital: 'AI',          standard: 'AI' },
  { id: 'content',     digital: 'CONTENT',     standard: 'Content' },
]

// Single filter rule for both themes: match on `category`, never `id`.
// (This is what pulls the `fresh-prints` service — category 'engineering' —
// into the Engineering tab without a special case.)
export function filterServicesByTab(list, tab) {
  return tab === 'all' ? list : list.filter(s => s.category === tab)
}

// ─────────────────────────────────────────────────────────────── DIGITAL ──
// Mono uppercase tabs on a hairline rule, underline tinted by category color.

function DigitalVariant({ active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      borderBottom: '1px solid var(--color-border-subtle)',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id
        const color = tab.id === 'all' ? 'var(--color-accent-primary)' : getCategoryColor(tab.id)
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              color: isActive ? color : 'var(--color-text-muted)',
              padding: 'var(--space-3) var(--space-5)',
              background: 'none',
              border: 'none',
              borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 150ms, border-color 150ms',
              flexShrink: 0,
            }}
          >
            {tab.digital}
          </button>
        )
      })}
    </div>
  )
}

// ────────────────────────────────────────────────────────────── STANDARD ──
// Sticky blurred bar pinned under the nav. Standard / Retro / Funky.

function StandardVariant({ active, onChange }) {
  return (
    <div style={{
      position: 'sticky',
      top: 'var(--nav-height)',
      zIndex: 10,
      background: 'var(--bg-overlay)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div className="s-container" style={{ padding: 0 }}>
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: active === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${active === tab.id ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer',
                padding: 'var(--space-4) var(--space-5)',
                whiteSpace: 'nowrap',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => {
                if (active !== tab.id) e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                if (active !== tab.id) e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              {tab.standard}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ServiceCategoryTabs({ active, onChange }) {
  const { themeId } = useTheme()
  return themeId === 'digital'
    ? <DigitalVariant active={active} onChange={onChange} />
    : <StandardVariant active={active} onChange={onChange} />
}

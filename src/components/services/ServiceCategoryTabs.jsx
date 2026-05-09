import { getCategoryColor } from '@/utils/categoryAssets'

const TABS = [
  { id: 'all',         label: 'ALL' },
  { id: 'engineering', label: 'ENGINEERING' },
  { id: 'software',    label: 'SOFTWARE' },
  { id: 'games',       label: 'GAMES' },
  { id: 'ai',          label: 'AI' },
  { id: 'content',     label: 'CONTENT' },
]

export default function ServiceCategoryTabs({ active, onChange }) {
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
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

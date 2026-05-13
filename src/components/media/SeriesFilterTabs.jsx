import { media } from '@/data/media'

const ALL_TAB = { id: 'all', label: 'ALL', color: null }
const TABS = [ALL_TAB, ...media.tabs]

export default function SeriesFilterTabs({ active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-1)',
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--color-border-subtle)',
        marginBottom: 'var(--space-8)',
        paddingBottom: 0,
      }}
    >
      {TABS.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
              padding: 'var(--space-3) var(--space-4)',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'color var(--duration-base), border-color var(--duration-base)',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

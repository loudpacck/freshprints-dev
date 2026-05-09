import { getCategoryColor } from '@/utils/categoryAssets'

const SERVICE_TYPES = [
  { id: 'engineering', label: 'Engineering',   icon: '⚙️' },
  { id: 'software',    label: 'Software',      icon: '</>' },
  { id: 'games',       label: 'Games',         icon: '🎮' },
  { id: 'ai',          label: 'AI',            icon: '◈' },
  { id: 'content',     label: 'Content',       icon: '▶' },
  { id: 'fresh-prints',label: 'Fresh Prints',  icon: '□' },
]

export default function IntakeStep1ServiceType({ watch, setValue }) {
  const selected = watch('serviceType')

  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-4xl)',
        color: 'var(--color-text-primary)',
        letterSpacing: 'var(--tracking-tight)',
        marginBottom: 'var(--space-2)',
      }}>
        What kind of work?
      </h2>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-6)',
      }}>
        Select one to continue.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-3)',
      }}>
        {SERVICE_TYPES.map(type => {
          const isSelected = selected === type.id
          const color = getCategoryColor(type.id === 'fresh-prints' ? 'engineering' : type.id)
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setValue('serviceType', type.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-5) var(--space-4)',
                background: isSelected ? `${color}18` : 'var(--color-bg-surface)',
                border: `1px solid ${isSelected ? color : 'var(--color-border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 150ms',
                boxShadow: isSelected ? `0 0 16px ${color}30` : 'none',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xl)',
                color: isSelected ? color : 'var(--color-text-muted)',
              }}>
                {type.icon}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
                color: isSelected ? color : 'var(--color-text-secondary)',
                transition: 'color 150ms',
              }}>
                {type.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

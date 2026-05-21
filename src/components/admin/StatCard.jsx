export default function StatCard({ label, value, loading, accent, sub }) {
  const color = accent || 'var(--color-accent-primary)'
  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
        margin: 0,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-4xl)',
        color,
        letterSpacing: 'var(--tracking-wide)',
        lineHeight: 1,
        margin: 0,
      }}>
        {loading ? '—' : typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
      </p>
      {sub && (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-text-muted)',
          letterSpacing: 'var(--tracking-wider)',
          margin: 0,
        }}>
          {sub}
        </p>
      )}
    </div>
  )
}

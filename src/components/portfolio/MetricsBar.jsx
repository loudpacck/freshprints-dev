export default function MetricsBar({ metrics }) {
  if (!metrics || metrics.length === 0) return null

  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        borderTop: '1px solid var(--color-border-subtle)',
        borderBottom: '1px solid var(--color-border-subtle)',
        padding: 'var(--space-12) var(--space-8)',
        marginBottom: 'var(--space-16)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)`,
          gap: 'var(--space-8)',
        }}
        className="metrics-bar-grid"
      >
        {metrics.map(({ label, value }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-4xl)',
                lineHeight: 'var(--leading-tight)',
                color: 'var(--color-text-accent)',
                letterSpacing: 'var(--tracking-tight)',
                marginBottom: 'var(--space-2)',
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .metrics-bar-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}

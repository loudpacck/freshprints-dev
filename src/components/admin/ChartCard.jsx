export default function ChartCard({ title, children, height = 200 }) {
  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
        marginBottom: 'var(--space-4)',
        marginTop: 0,
      }}>
        // {title}
      </p>
      <div style={{ height }}>
        {children}
      </div>
    </div>
  )
}

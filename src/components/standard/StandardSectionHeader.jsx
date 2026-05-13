export default function StandardSectionHeader({ eyebrow, heading, subtitle, center = false }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', marginBottom: 'var(--space-10)' }}>
      {eyebrow && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
          marginBottom: 'var(--space-3)',
        }}>
          {eyebrow}
        </div>
      )}
      <h2 style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 'var(--weight-semibold)',
        fontSize: 'var(--text-4xl)',
        color: 'var(--text-primary)',
        letterSpacing: 'var(--tracking-tight)',
        lineHeight: 'var(--leading-snug)',
        marginBottom: subtitle ? 'var(--space-3)' : 0,
      }}>
        {heading}
      </h2>
      {subtitle && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-lg)',
          color: 'var(--text-secondary)',
          maxWidth: center ? 640 : 640,
          lineHeight: 'var(--leading-normal)',
          margin: center ? '0 auto' : 0,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

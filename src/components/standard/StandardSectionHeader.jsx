// Editorial-technical section header: mono eyebrow (optional leading index +
// hairline tick), oversized display heading, measured subtitle.
export default function StandardSectionHeader({ eyebrow, heading, subtitle, index, center = false }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', marginBottom: 'var(--space-10)' }}>
      {eyebrow && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          justifyContent: center ? 'center' : 'flex-start',
          marginBottom: 'var(--space-4)',
        }}>
          {index && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--label-size)',
              color: 'var(--text-tertiary)',
              letterSpacing: 'var(--label-tracking)',
            }}>
              {index}
            </span>
          )}
          {!center && (
            <span aria-hidden="true" style={{ width: 'var(--space-6)', height: '1px', background: 'var(--accent)' }} />
          )}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--label-size)',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--label-tracking)',
          }}>
            {eyebrow}
          </span>
        </div>
      )}
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 'var(--weight-bold)',
        fontSize: 'var(--display-md)',
        color: 'var(--text-primary)',
        letterSpacing: 'var(--tracking-display)',
        lineHeight: 'var(--leading-display)',
        margin: 0,
        marginBottom: subtitle ? 'var(--space-4)' : 0,
      }}>
        {heading}
      </h2>
      {subtitle && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-lg)',
          color: 'var(--text-secondary)',
          maxWidth: 'var(--measure-prose)',
          lineHeight: 'var(--leading-normal)',
          margin: center ? '0 auto' : 0,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

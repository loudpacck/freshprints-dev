import { getCategoryColor } from '@/utils/categoryAssets'

const PLACEHOLDERS = [
  { category: 'engineering' },
  { category: 'software' },
  { category: 'games' },
]

export default function TestimonialsPlaceholder() {
  return (
    <section style={{ marginBottom: 'var(--space-20)' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        marginBottom: 'var(--space-8)',
      }}>
        // CLIENT WORK
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {PLACEHOLDERS.map((p, i) => {
          const color = getCategoryColor(p.category)
          return (
            <div
              key={i}
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {/* Avatar placeholder */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `${color}18`,
                  border: `1px solid ${color}33`,
                  flexShrink: 0,
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ width: 80, height: 8, background: 'var(--color-border-subtle)', borderRadius: 4 }} />
                  <div style={{ width: 60, height: 6, background: 'var(--color-border-subtle)', borderRadius: 4 }} />
                </div>
              </div>

              {/* Quote placeholder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width: '100%', height: 6, background: 'var(--color-border-subtle)', borderRadius: 4 }} />
                <div style={{ width: '90%', height: 6, background: 'var(--color-border-subtle)', borderRadius: 4 }} />
                <div style={{ width: '75%', height: 6, background: 'var(--color-border-subtle)', borderRadius: 4 }} />
              </div>

              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
              }}>
                Client testimonial coming soon
              </span>

              {/* Category tag */}
              <span style={{
                alignSelf: 'flex-start',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color,
                background: `${color}12`,
                border: `1px solid ${color}33`,
                borderRadius: 'var(--radius-full)',
                padding: 'var(--space-1) var(--space-3)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
              }}>
                {p.category}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

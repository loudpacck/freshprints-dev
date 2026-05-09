import { skillTiers } from '@/data/skills'

export default function AboutStack() {
  return (
    <section style={{ marginBottom: 'var(--space-20)' }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-accent)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-widest)',
        marginBottom: 'var(--space-6)',
      }}>
        // THE STACK
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {skillTiers.tools.map(tool => (
          <a
            key={tool.id}
            href={`/skills?focus=${tool.id}`}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-2) var(--space-3)',
              textDecoration: 'none',
              transition: 'border-color var(--duration-base), color var(--duration-base)',
              display: 'inline-block',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-accent-primary)'
              e.currentTarget.style.color = 'var(--color-text-accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
          >
            {tool.label}
          </a>
        ))}
      </div>
    </section>
  )
}

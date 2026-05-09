import { getCategoryIcon } from '@/utils/categoryAssets'

const CAPS = [
  { key: 'software',    label: 'SOFTWARE',    desc: 'Full-stack apps, APIs, dashboards',     color: '#00C8FF' },
  { key: 'games',       label: 'GAMES',       desc: 'Roblox, Unreal, multiplayer systems',   color: '#FFB347' },
  { key: 'engineering', label: 'ENGINEERING', desc: 'CAD, manufacturability, prototyping',   color: '#A0A0B8' },
  { key: 'ai',          label: 'AI',          desc: 'Workflows, ML pipelines, tooling',      color: '#8B5CF6' },
  { key: 'content',     label: 'CONTENT',     desc: 'Devlogs, thumbnails, video',            color: '#FBBF24' },
]

export default function AboutCapabilities() {
  return (
    <section style={{ marginBottom: 'var(--space-20)' }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-accent)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-widest)',
        marginBottom: 'var(--space-8)',
      }}>
        // I BUILD
      </p>

      <div className="grid-5-col">
        {CAPS.map(cap => (
          <div
            key={cap.key}
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderTop: `2px solid ${cap.color}`,
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ color: cap.color, lineHeight: 0 }}>
              {getCategoryIcon(cap.key)}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              color: 'var(--color-text-primary)',
              letterSpacing: 'var(--tracking-wide)',
            }}>
              {cap.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              lineHeight: 'var(--leading-snug)',
            }}>
              {cap.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

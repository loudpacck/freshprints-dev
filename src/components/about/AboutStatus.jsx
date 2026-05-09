import { siteStatus } from '@/data/siteStatus'
import AvailabilityIndicator from '@/components/services/AvailabilityIndicator'

function Row({ label, isLast, children }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)',
      padding: 'var(--space-4) 0',
      borderBottom: isLast ? 'none' : '1px solid var(--color-border-subtle)',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        minWidth: 120,
        flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-primary)',
      }}>
        {children}
      </span>
    </div>
  )
}

export default function AboutStatus() {
  const activeProject = siteStatus.projects.find(p => p.status === 'ACTIVE')

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
        // CURRENTLY
      </p>

      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 'var(--space-6)',
          right: 'var(--space-6)',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--color-accent-primary)',
          animation: 'glowPulse 2s ease-in-out infinite',
        }} />

        <Row label="LOCATION">Massachusetts, US</Row>
        <Row label="WORKING ON">{activeProject?.name ?? 'Multiple projects'}</Row>
        <Row label="AVAILABILITY">
          <AvailabilityIndicator />
        </Row>
        <Row label="LAST SHIPPED" isLast>Predictinator v2.4 — December 2024</Row>
      </div>
    </section>
  )
}

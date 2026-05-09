import { siteStatus } from '@/data/siteStatus'

const STATUS_MAP = {
  OPEN:        { color: '#22C55E', label: 'AVAILABLE FOR WORK' },
  BOOKING:     { color: '#F59E0B', label: 'BOOKING AHEAD' },
  UNAVAILABLE: { color: '#EF4444', label: 'NOT TAKING WORK' },
}

export default function AvailabilityIndicator() {
  const { color, label } = STATUS_MAP[siteStatus.availability] ?? STATUS_MAP.UNAVAILABLE

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-medium)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        color: label === 'AVAILABLE FOR WORK' ? color : 'var(--color-text-secondary)',
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${color}44`,
        borderRadius: 'var(--radius-full)',
        padding: 'var(--space-2) var(--space-4)',
      }}>
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          animation: siteStatus.availability === 'OPEN' ? 'glowPulse 2s ease-in-out infinite' : 'none',
        }} />
        {label}
      </span>
      {siteStatus.availabilityNote && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}>
          {siteStatus.availabilityNote}
        </span>
      )}
    </div>
  )
}

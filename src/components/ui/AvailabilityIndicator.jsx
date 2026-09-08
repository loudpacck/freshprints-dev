import { siteStatus } from '@/data/siteStatus'
import { useTheme } from '@/themes/useTheme'

// Canonical availability vocabulary. Keys must match `siteStatus.availability`.
const STATUS_MAP = {
  OPEN:        { color: '#22C55E', label: 'AVAILABLE FOR WORK' },
  BOOKING:     { color: '#F59E0B', label: 'BOOKING AHEAD' },
  UNAVAILABLE: { color: '#EF4444', label: 'NOT TAKING WORK' },
}

function resolveStatus() {
  return STATUS_MAP[siteStatus.availability] ?? STATUS_MAP.UNAVAILABLE
}

// ─────────────────────────────────────────────────────────────── DIGITAL ──
// Pulsing pill + note underneath. Used on Digital /services and Digital /about.

function DigitalVariant() {
  const { color, label } = resolveStatus()

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
        color: siteStatus.availability === 'OPEN' ? color : 'var(--color-text-secondary)',
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

// ────────────────────────────────────────────────────────────── STANDARD ──
// Inline card strip: dot + note + last-updated stamp. Standard / Retro / Funky.

function StandardVariant() {
  const { color } = resolveStatus()

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4) var(--space-5)',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-primary)',
      }}>
        {siteStatus.availabilityNote}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)',
      }}>
        Updated {siteStatus.lastUpdated}
      </span>
    </div>
  )
}

export default function AvailabilityIndicator() {
  const { themeId } = useTheme()
  return themeId === 'digital' ? <DigitalVariant /> : <StandardVariant />
}

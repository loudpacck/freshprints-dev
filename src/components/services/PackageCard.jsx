import { useTheme } from '@/themes/useTheme'
import { getCategoryColor } from '@/utils/categoryAssets'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StandardButton from '@/components/standard/StandardButton'

function formatPrice(price) {
  if (price >= 1000) return `$${(price / 1000).toLocaleString('en-US', { minimumFractionDigits: price % 1000 === 0 ? 0 : 1 })}K`
  return `$${price}`
}

// ─────────────────────────────────────────────────────────────── DIGITAL ──
// Abbreviated price ($4.5K) under a STARTING AT label, // INCLUDED deliverables
// with square bullets, everything tinted by the service's category accent.

function DigitalVariant({ pkg, serviceCategory, onInquire }) {
  const accentColor = getCategoryColor(serviceCategory)

  return (
    <Card hoverable accentColor={accentColor} style={{ padding: 'var(--space-6)', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%' }}>
        {/* Name */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          {pkg.name}
        </div>

        {/* Price */}
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-widest)',
            marginBottom: 'var(--space-1)',
          }}>
            STARTING AT
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            color: accentColor,
            lineHeight: 1,
          }}>
            {formatPrice(pkg.priceFrom)}
          </div>
        </div>

        {/* Timeline badge */}
        <span style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          background: 'var(--color-bg-base)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-1) var(--space-3)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)',
        }}>
          {pkg.timeline}
        </span>

        {/* Deliverables */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-3)',
          }}>
            // INCLUDED
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {pkg.deliverables.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <span style={{
                  width: 6,
                  height: 6,
                  background: accentColor,
                  flexShrink: 0,
                  marginTop: 5,
                  borderRadius: 1,
                }} />
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-snug)',
                }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Button
          fullWidth
          onClick={() => onInquire?.()}
          style={{
            background: `${accentColor}18`,
            color: accentColor,
            borderColor: accentColor,
          }}
          variant="secondary"
        >
          INQUIRE
        </Button>
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────── STANDARD ──
// Full price (From $4,500) on a footer row, checkmark deliverables, neutral
// borders that firm up on hover. Standard / Retro / Funky.

function StandardVariant({ pkg, onInquire }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-strong)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--text-xl)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}>
          {pkg.name}
        </div>
        {pkg.timeline && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {pkg.timeline}
          </div>
        )}
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {pkg.deliverables.map((item, i) => (
          <li key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-normal)',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3, color: 'var(--accent)' }} aria-hidden="true">
              <path d="M2.5 7L6 10.5l5.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {item}
          </li>
        ))}
      </ul>

      <div style={{
        marginTop: 'auto',
        paddingTop: 'var(--space-4)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-bold)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--text-primary)',
        }}>
          {pkg.priceFrom ? `From $${pkg.priceFrom.toLocaleString()}` : 'Custom quote'}
        </span>
        <StandardButton variant="secondary" size="sm" onClick={() => onInquire?.()}>
          Inquire
        </StandardButton>
      </div>
    </div>
  )
}

export default function PackageCard({ pkg, serviceCategory, onInquire }) {
  const { themeId } = useTheme()
  if (themeId === 'digital') {
    return <DigitalVariant pkg={pkg} serviceCategory={serviceCategory} onInquire={onInquire} />
  }
  return <StandardVariant pkg={pkg} onInquire={onInquire} />
}

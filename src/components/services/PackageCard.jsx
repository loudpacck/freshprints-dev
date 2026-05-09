import { motion } from 'framer-motion'
import { getCategoryColor } from '@/utils/categoryAssets'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function formatPrice(price) {
  if (price >= 1000) return `$${(price / 1000).toLocaleString('en-US', { minimumFractionDigits: price % 1000 === 0 ? 0 : 1 })}K`
  return `$${price}`
}

export default function PackageCard({ pkg, serviceCategory, onInquire }) {
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

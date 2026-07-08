import { useState } from 'react'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'

const TYPE_COLORS = {
  digital:  { color: '#00C8FF', bg: 'rgba(0, 200, 255, 0.12)',  label: 'DIGITAL' },
  software: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', label: 'SOFTWARE' },
  physical: { color: '#FFB347', bg: 'rgba(255, 179, 71, 0.12)', label: 'PHYSICAL' },
}

const TYPE_ICONS = {
  digital: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M6 4h14l6 6v18H6V4z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 4v6h6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 14h12M10 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  software: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="3" y="7" width="26" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 13l-4 3 4 3M22 13l4 3-4 3M17 11l-2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  physical: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 3L28 10v12L16 29 4 22V10L16 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 3v26M4 10l12 7 12-7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
}

function ImageArea({ product, size }) {
  const [imgError, setImgError] = useState(false)
  const typeStyle = TYPE_COLORS[product.type] ?? TYPE_COLORS.digital
  const aspectPaddingTop = size === 'featured' ? '42.86%' : '56.25%'

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: aspectPaddingTop, overflow: 'hidden', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
      {!imgError ? (
        <img
          src={product.image}
          alt={product.name}
          onError={() => setImgError(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${typeStyle.bg} 0%, var(--color-bg-elevated) 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: typeStyle.color,
          }}
        >
          {TYPE_ICONS[product.type] ?? TYPE_ICONS.digital}
        </div>
      )}
    </div>
  )
}

export default function ProductCard({ product, size = 'default', onClick }) {
  const typeStyle = TYPE_COLORS[product.type] ?? TYPE_COLORS.digital
  const nameSize = size === 'featured' ? 'var(--text-3xl)' : 'var(--text-2xl)'

  return (
    <Card hoverable onClick={onClick} style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ImageArea product={product} size={size} />

      {/* Type tag */}
      <span
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
          color: typeStyle.color,
          background: typeStyle.bg,
          border: `1px solid ${typeStyle.color}33`,
          borderRadius: 'var(--radius-sm)',
          padding: '2px var(--space-2)',
          marginBottom: 'var(--space-3)',
        }}
      >
        {typeStyle.label}
      </span>

      {/* Name */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: nameSize,
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--leading-tight)',
          letterSpacing: 'var(--tracking-wide)',
          marginBottom: 'var(--space-2)',
          margin: '0 0 var(--space-2)',
        }}
      >
        {product.name}
      </h3>

      {/* Tagline */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          lineHeight: 'var(--leading-normal)',
          margin: '0 0 var(--space-4)',
          flexGrow: 1,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.tagline}
      </p>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            color: 'var(--color-accent-primary)',
            lineHeight: 1,
          }}
        >
          {product.priceDisplay}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: product.comingSoon ? 'var(--color-accent-secondary)' : 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
          }}
        >
          {product.comingSoon ? 'COMING SOON' : 'VIEW →'}
        </span>
      </div>
    </Card>
  )
}

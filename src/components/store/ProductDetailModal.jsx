import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useSound } from '@/sound/useSound'

const TYPE_COLORS = {
  digital:  { color: '#00C8FF', bg: 'rgba(0, 200, 255, 0.12)', label: 'DIGITAL' },
  software: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', label: 'SOFTWARE' },
  physical: { color: '#FFB347', bg: 'rgba(255, 179, 71, 0.12)', label: 'PHYSICAL' },
}

const DELIVERY_LABELS = {
  digital:  '// DELIVERED VIA GUMROAD',
  software: '// DELIVERED VIA GUMROAD',
  physical: '// VIA INQUIRY',
}

function HeroImage({ product }) {
  const [imgError, setImgError] = useState(false)
  const typeStyle = TYPE_COLORS[product.type] ?? TYPE_COLORS.digital

  return (
    <div
      style={{
        width: '100%',
        paddingTop: '40%',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 'var(--space-6)',
      }}
    >
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
          }}
        />
      )}
    </div>
  )
}

export default function ProductDetailModal({ product, onClose }) {
  const navigate = useNavigate()
  const { play } = useSound()
  const typeStyle = TYPE_COLORS[product.type] ?? TYPE_COLORS.digital
  const isExternal = !product.purchaseUrl.startsWith('/')

  useEffect(() => {
    play('modalOpen')
    document.body.style.overflow = 'hidden'
    function onKey(e) { if (e.key === 'Escape') { play('modalClose'); onClose() } }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, play])

  function handleBuy() {
    if (isExternal) {
      window.open(product.purchaseUrl, '_blank', 'noopener noreferrer')
    } else {
      onClose()
      navigate(product.purchaseUrl)
    }
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--color-bg-overlay)',
          zIndex: 'var(--z-modal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          overflowY: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            maxWidth: 800,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => { play('modalClose'); onClose() }}
            style={{
              position: 'absolute',
              top: 'var(--space-6)',
              right: 'var(--space-6)',
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              zIndex: 1,
            }}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <HeroImage product={product} />

          {/* Type + status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                color: typeStyle.color,
                background: typeStyle.bg,
                border: `1px solid ${typeStyle.color}33`,
                borderRadius: 'var(--radius-sm)',
                padding: '2px var(--space-2)',
              }}
            >
              {typeStyle.label}
            </span>
            <Badge status={product.status === 'AVAILABLE' ? 'STABLE' : 'CONCEPT'} label={product.status} />
          </div>

          {/* Name */}
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-4xl)',
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--leading-tight)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-3)',
            }}
          >
            {product.name}
          </h2>

          {/* Tagline */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-normal)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {product.tagline}
          </p>

          {/* Description */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-loose)',
              marginBottom: 'var(--space-8)',
            }}
          >
            {product.description}
          </p>

          {/* What's included */}
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              marginBottom: 'var(--space-4)',
            }}
          >
            // WHAT'S INCLUDED
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {product.includes.map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-normal)',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: 'var(--color-accent-primary)',
                    flexShrink: 0,
                    marginTop: 6,
                    borderRadius: 1,
                  }}
                />
                {item}
              </li>
            ))}
          </ul>

          {/* Price + CTA */}
          <div
            style={{
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-6)',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-4xl)',
                color: 'var(--color-accent-primary)',
                lineHeight: 1,
              }}
            >
              {product.priceDisplay}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Button variant="primary" onClick={handleBuy}>
                BUY NOW
              </Button>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wider)',
                  textAlign: 'center',
                }}
              >
                {DELIVERY_LABELS[product.type] ?? '// DELIVERED VIA GUMROAD'}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

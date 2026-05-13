import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { products, getProductsByType } from '@/data/storeProducts'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'
import StandardPillFilter from '@/components/standard/StandardPillFilter'

const FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'digital',  label: 'Digital' },
  { value: 'software', label: 'Software' },
  { value: 'physical', label: 'Physical' },
]

const TYPE_LABELS = {
  digital:  { label: 'Digital',  color: 'var(--accent)' },
  software: { label: 'Software', color: '#8B5CF6' },
  physical: { label: 'Physical', color: '#FFB347' },
}

function ProductModal({ product, onClose }) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [imgFailed, setImgFailed] = useState(false)
  const typeStyle = TYPE_LABELS[product.type] || TYPE_LABELS.digital
  const isExternal = !product.purchaseUrl.startsWith('/')

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
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg-overlay)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          overflowY: 'auto',
        }}
      >
        <motion.div
          initial={reduced ? {} : { opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduced ? {} : { opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-8)',
            maxWidth: 720,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 'var(--space-5)',
              right: 'var(--space-5)',
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Image */}
          <div style={{
            width: '100%',
            aspectRatio: '16/7',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            background: 'var(--bg-card)',
            marginBottom: 'var(--space-6)',
          }}>
            {product.image && !imgFailed ? (
              <img
                src={product.image}
                alt={product.name}
                onError={() => setImgFailed(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: `linear-gradient(135deg, ${typeStyle.color}18 0%, var(--bg-card) 100%)`,
              }} />
            )}
          </div>

          {/* Type tag */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: typeStyle.color,
              background: `${typeStyle.color}14`,
              border: `1px solid ${typeStyle.color}30`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-1) var(--space-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {typeStyle.label}
            </span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--text-4xl)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--space-3)',
          }}>
            {product.name}
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-normal)',
            marginBottom: 'var(--space-5)',
          }}>
            {product.tagline}
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            marginBottom: 'var(--space-6)',
          }}>
            {product.description}
          </p>

          {/* Includes */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-3)',
          }}>
            What's Included
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {product.includes.map((item, i) => (
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

          {/* Price + CTA */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-6)',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-4xl)',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}>
              {product.priceDisplay}
            </span>
            <StandardButton size="lg" onClick={handleBuy}>
              Buy Now
            </StandardButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

function ProductCard({ product, onOpen }) {
  const reduced = useReducedMotion()
  const [imgFailed, setImgFailed] = useState(false)
  const typeStyle = TYPE_LABELS[product.type] || TYPE_LABELS.digital

  return (
    <motion.div
      onClick={() => onOpen(product)}
      whileHover={reduced ? {} : { y: -2, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{
        aspectRatio: '16/10',
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {product.image && !imgFailed ? (
          <motion.img
            src={product.image}
            alt={product.name}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            whileHover={reduced ? {} : { scale: 1.02 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${typeStyle.color}18 0%, var(--bg-elevated) 100%)`,
          }} />
        )}
      </div>

      <div style={{
        padding: 'var(--space-5)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: typeStyle.color,
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
        }}>
          {typeStyle.label}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--text-xl)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-snug)',
        }}>
          {product.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--leading-normal)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {product.tagline}
        </div>
        <div style={{
          marginTop: 'auto',
          paddingTop: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--text-2xl)',
            color: 'var(--text-primary)',
          }}>
            {product.priceDisplay}
          </span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--accent)',
          }}>
            View →
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function StandardStore() {
  const reduced = useReducedMotion()
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const filtered = getProductsByType(activeFilter)

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero */}
      <section style={{
        paddingTop: 'var(--space-16)',
        paddingBottom: 'var(--space-10)',
        background: 'var(--gradient-hero)',
      }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              marginBottom: 'var(--space-3)',
            }}>
              // STORE
            </div>
            <h1 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-6xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
              marginBottom: 'var(--space-4)',
            }}>
              Products &amp; Goods
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: 560,
              lineHeight: 'var(--leading-normal)',
            }}>
              Digital products, software, and physical goods. Things I made that you can buy.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <Reveal>
            <StandardPillFilter options={FILTERS} active={activeFilter} onChange={setActiveFilter} />
          </Reveal>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={reduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="s-grid-3"
              style={{ marginTop: 'var(--space-8)' }}
            >
              {filtered.map((product, i) => (
                <Reveal key={product.id} delay={i * 0.05}>
                  <ProductCard product={product} onOpen={setSelectedProduct} />
                </Reveal>
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-16) 0',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
            }}>
              No products in this category yet.
            </div>
          )}
        </div>
      </section>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </motion.div>
  )
}

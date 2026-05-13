import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { products, getProductsByType, getFeaturedProducts } from '@/data/storeProducts'
import StoreFeaturedStrip from '@/components/store/StoreFeaturedStrip'
import ProductGrid from '@/components/store/ProductGrid'
import ProductDetailModal from '@/components/store/ProductDetailModal'
import Button from '@/components/ui/Button'

const TYPE_TABS = [
  { id: 'all',      label: 'ALL' },
  { id: 'digital',  label: 'DIGITAL' },
  { id: 'software', label: 'SOFTWARE' },
  { id: 'physical', label: 'PHYSICAL' },
]

const featured = getFeaturedProducts()

export default function Store() {
  const navigate = useNavigate()
  const [activeType, setActiveType] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const filtered = getProductsByType(activeType)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ minHeight: '100vh', background: 'var(--color-bg-base)' }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: 'var(--space-8) var(--space-8) var(--space-24)',
          }}
        >
          {/* Header */}
          <div style={{ paddingTop: 'var(--space-16)', marginBottom: 'var(--space-16)' }}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-accent)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-widest)',
                marginBottom: 'var(--space-4)',
              }}
            >
              // STORE
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-hero)',
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--leading-tight)',
                letterSpacing: 'var(--tracking-tight)',
                marginBottom: 'var(--space-6)',
              }}
            >
              BUILT TO SELL
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xl)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-normal)',
                maxWidth: 520,
              }}
            >
              Templates, tools, and physical parts. Things I build for myself, packaged for you.
            </p>
          </div>

          {/* Featured strip */}
          <StoreFeaturedStrip products={featured} onProductClick={setSelectedProduct} />

          {/* Type filter tabs */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-8)',
            }}
          >
            {TYPE_TABS.map(tab => {
              const isActive = tab.id === activeType
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveType(tab.id)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wider)',
                    padding: 'var(--space-2) var(--space-5)',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? 'var(--color-accent-primary)' : 'transparent',
                    color: isActive ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                    border: `1px solid ${isActive ? 'var(--color-accent-primary)' : 'var(--color-border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all var(--duration-base)',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Product grid */}
          <div style={{ marginBottom: 'var(--space-20)' }}>
            <ProductGrid products={filtered} onProductClick={setSelectedProduct} />
          </div>

          {/* CTA strip */}
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-6)',
              flexWrap: 'wrap',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Want something custom?
            </p>
            <Button variant="secondary" onClick={() => navigate('/services')}>
              DISCUSS A CONTRACT
            </Button>
          </div>
        </div>
      </motion.div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  )
}

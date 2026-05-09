import ProductCard from './ProductCard'

export default function StoreFeaturedStrip({ products, onProductClick }) {
  const [large, ...stacked] = products

  return (
    <div style={{ marginBottom: 'var(--space-16)' }}>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-accent)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
          marginBottom: 'var(--space-6)',
        }}
      >
        // FEATURED
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60% 40%',
          gap: 'var(--space-6)',
        }}
        className="featured-strip-grid"
      >
        {/* Large card */}
        {large && (
          <div>
            <ProductCard product={large} size="featured" onClick={() => onProductClick(large)} />
          </div>
        )}

        {/* Stacked cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {stacked.map(p => (
            <div key={p.id} style={{ flex: 1 }}>
              <ProductCard product={p} size="default" onClick={() => onProductClick(p)} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .featured-strip-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

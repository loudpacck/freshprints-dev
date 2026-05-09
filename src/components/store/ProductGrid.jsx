import { AnimatePresence, motion } from 'framer-motion'
import ProductCard from './ProductCard'

export default function ProductGrid({ products, onProductClick }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-6)',
      }}
      className="product-grid"
    >
      <AnimatePresence mode="popLayout">
        {products.map(product => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProductCard product={product} onClick={() => onProductClick(product)} />
          </motion.div>
        ))}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .product-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 540px) {
          .product-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

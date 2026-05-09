import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % images.length)
      if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        background: 'rgba(10,10,15,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
        <img
          src={images[current]}
          alt={`Visual ${current + 1}`}
          style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
              style={navBtnStyle('left')}
            >
              ←
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % images.length)}
              style={navBtnStyle('right')}
            >
              →
            </button>
            <div style={{ textAlign: 'center', marginTop: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {current + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

function navBtnStyle(side) {
  return {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    [side]: -48,
    background: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-lg)',
    width: 40,
    height: 40,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

export default function VisualGallery({ images }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!images || images.length === 0) {
    return (
      <section style={{ marginBottom: 'var(--space-16)' }}>
        <div style={sectionLabel}>// VISUALS</div>
        <div
          style={{
            padding: 'var(--space-12)',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
          }}
        >
          // VISUALS COMING SOON
        </div>
      </section>
    )
  }

  return (
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <div style={sectionLabel}>// VISUALS</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Visual ${i + 1}`}
            onClick={() => setLightboxIndex(i)}
            style={{
              width: '100%',
              aspectRatio: '16/9',
              objectFit: 'cover',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              border: '1px solid var(--color-border-subtle)',
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

const sectionLabel = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-widest)',
  marginBottom: 'var(--space-6)',
}

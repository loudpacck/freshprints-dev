import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSound } from '@/sound/useSound'
import { getEmbedUrl } from '@/data/media'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
}

export default function VideoLightbox({ video, onClose }) {
  const { play } = useSound()

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
          background: 'rgba(10, 10, 15, 0.95)',
          zIndex: 'var(--z-modal)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 1200,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          {/* Close button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { play('modalClose'); onClose() }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                background: 'none',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-4)',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              CLOSE (ESC)
            </button>
          </div>

          {/* 16:9 iframe */}
          <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000' }}>
            <iframe
              src={getEmbedUrl(video.id)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title={video.title}
            />
          </div>

          {/* Metadata */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--color-text-primary)',
                  letterSpacing: 'var(--tracking-wide)',
                  margin: '0 0 var(--space-2)',
                }}
              >
                {video.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                {video.description}
              </p>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', letterSpacing: 'var(--tracking-wide)' }}>
              {formatDate(video.publishedAt)} · {video.duration}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

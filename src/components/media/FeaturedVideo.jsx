import { useState } from 'react'
import Button from '@/components/ui/Button'
import VideoLightbox from './VideoLightbox'
import { getThumbnailUrl, getThumbnailFallbackUrl } from '@/data/media'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
}

function Thumbnail({ video, onClick }) {
  const [fallbackStage, setFallbackStage] = useState(0)
  const [src, setSrc] = useState(() => getThumbnailUrl(video.id))

  function handleError() {
    if (fallbackStage === 0) {
      setSrc(getThumbnailFallbackUrl(video.id))
      setFallbackStage(1)
    } else {
      setFallbackStage(2)
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--color-bg-elevated)',
      }}
    >
      {fallbackStage < 2 ? (
        <img
          src={src}
          alt={video.title}
          onError={handleError}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,200,255,0.12) 0%, var(--color-bg-elevated) 100%)' }} />
      )}
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--color-accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-blue)',
          }}
        >
          <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
            <path d="M2 2l16 10L2 22V2z" fill="var(--color-text-inverse)" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function FeaturedVideo({ video, channelUrl }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <>
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          marginBottom: 'var(--space-16)',
          display: 'grid',
          gridTemplateColumns: '60% 40%',
          gap: 'var(--space-8)',
          alignItems: 'center',
        }}
        className="featured-video-grid"
      >
        {/* Left: player thumbnail */}
        <Thumbnail video={video} onClick={() => setLightboxOpen(true)} />

        {/* Right: metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              margin: 0,
            }}
          >
            // FEATURED
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-3xl)',
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--leading-snug)',
              letterSpacing: 'var(--tracking-tight)',
              margin: 0,
            }}
          >
            {video.title}
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-normal)',
              margin: 0,
            }}
          >
            {video.description}
          </p>

          {video.duration && video.publishedAt && (
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                letterSpacing: 'var(--tracking-wide)',
                margin: 0,
              }}
            >
              {video.duration} · {formatDate(video.publishedAt)}
            </p>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => setLightboxOpen(true)}>
              WATCH NOW
            </Button>
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="ghost">
                SUBSCRIBE →
              </Button>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .featured-video-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {lightboxOpen && <VideoLightbox video={video} onClose={() => setLightboxOpen(false)} />}
    </>
  )
}

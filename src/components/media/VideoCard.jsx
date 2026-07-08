import { useState } from 'react'
import Card from '@/components/ui/Card'
import { getTabById, getThumbnailUrl, getThumbnailFallbackUrl } from '@/data/media'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
}

function VideoThumbnail({ videoId, title }) {
  const [src, setSrc] = useState(() => getThumbnailUrl(videoId))
  const [fallbackStage, setFallbackStage] = useState(0)

  function handleError() {
    if (fallbackStage === 0) {
      setSrc(getThumbnailFallbackUrl(videoId))
      setFallbackStage(1)
    } else {
      setFallbackStage(2)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-elevated)' }}>
      {fallbackStage < 2 ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={handleError}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,200,255,0.1) 0%, var(--color-bg-elevated) 100%)',
          }}
        />
      )}
      {/* Play button overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--color-accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <path d="M2 1.5l10 6.5-10 6.5V1.5z" fill="var(--color-text-inverse)" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function VideoCard({ video, onPlay }) {
  const tab = getTabById(video.tabId)

  return (
    <Card hoverable onClick={() => onPlay(video)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', position: 'relative' }}>
      {/* Thumbnail with duration badge */}
      <div style={{ position: 'relative' }}>
        <VideoThumbnail videoId={video.id} title={video.title} />
        {video.duration && (
          <span
            style={{
              position: 'absolute',
              bottom: 'var(--space-2)',
              right: 'var(--space-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg-overlay)',
              padding: '2px var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            {video.duration}
          </span>
        )}
      </div>

      {/* Tab tag */}
      {tab && (
        <span
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            color: tab.color ?? 'var(--color-accent-primary)',
            background: tab.color ? `${tab.color}18` : 'rgba(0,200,255,0.08)',
            border: `1px solid ${tab.color ? `${tab.color}33` : 'rgba(0,200,255,0.2)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '2px var(--space-2)',
          }}
        >
          {tab.label}
        </span>
      )}

      {/* Title */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--leading-snug)',
          letterSpacing: 'var(--tracking-wide)',
          margin: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {video.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          lineHeight: 'var(--leading-normal)',
          margin: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          flexGrow: 1,
        }}
      >
        {video.description}
      </p>

      {/* Date */}
      {video.publishedAt && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            margin: 0,
            letterSpacing: 'var(--tracking-wide)',
          }}
        >
          {formatDate(video.publishedAt)}
        </p>
      )}
    </Card>
  )
}

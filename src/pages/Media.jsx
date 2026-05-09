import { useState } from 'react'
import { motion } from 'framer-motion'
import { media, getVideosBySeries } from '@/data/media'
import FeaturedVideo from '@/components/media/FeaturedVideo'
import SeriesFilterTabs from '@/components/media/SeriesFilterTabs'
import VideoGrid from '@/components/media/VideoGrid'
import VideoLightbox from '@/components/media/VideoLightbox'
import NewsletterStrip from '@/components/media/NewsletterStrip'

export default function Media() {
  const [activeSeries, setActiveSeries] = useState('all')
  const [playingVideo, setPlayingVideo] = useState(null)

  const filteredVideos = getVideosBySeries(activeSeries)

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
          <div
            style={{
              paddingTop: 'var(--space-16)',
              marginBottom: 'var(--space-16)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 'var(--space-8)',
              flexWrap: 'wrap',
            }}
          >
            <div>
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
                // MEDIA
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
                VIDEO + DEVLOGS
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-xl)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-normal)',
                  maxWidth: 520,
                  margin: 0,
                }}
              >
                Devlogs, build series, and one-offs from the workshop.
              </p>
            </div>

            <a
              href={media.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-accent)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                whiteSpace: 'nowrap',
              }}
            >
              → SUBSCRIBE ON YOUTUBE
            </a>
          </div>

          {/* Featured video */}
          <FeaturedVideo video={media.featured} channelUrl={media.channelUrl} />

          {/* Series filter */}
          <SeriesFilterTabs active={activeSeries} onChange={setActiveSeries} />

          {/* Video grid */}
          <VideoGrid videos={filteredVideos} onPlay={setPlayingVideo} />

          {/* Newsletter */}
          <NewsletterStrip />
        </div>
      </motion.div>

      {playingVideo && (
        <VideoLightbox video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { media, getVideosForTab, getThumbnailUrl, getThumbnailFallbackUrl, getEmbedUrl } from '@/data/media'
import FeaturedVideo from '@/components/media/FeaturedVideo'
import SeriesFilterTabs from '@/components/media/SeriesFilterTabs'
import VideoGrid from '@/components/media/VideoGrid'
import VideoLightbox from '@/components/media/VideoLightbox'
import NewsletterStrip from '@/components/media/NewsletterStrip'

function ComingSoon({ tabLabel, message }) {
  return (
    <div style={{
      padding: 'var(--space-20) 0',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-accent)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-widest)',
        marginBottom: 'var(--space-4)',
      }}>
        // {tabLabel?.toUpperCase() ?? 'ALL'} — INCOMING
      </p>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-base)',
        color: 'var(--color-text-muted)',
        letterSpacing: 'var(--tracking-wide)',
        maxWidth: 480,
        margin: '0 auto',
        lineHeight: 1.6,
      }}>
        {message ?? 'CONTENT UPLOADING SOON...'}
      </p>
    </div>
  )
}

export default function DigitalMedia() {
  const [activeTab, setActiveTab] = useState('all')
  const [playingVideo, setPlayingVideo] = useState(null)

  const filteredVideos = getVideosForTab(activeTab)
  const featuredVideo = media.featuredVideoId
    ? media.videos.find(v => v.id === media.featuredVideoId) ?? null
    : null

  const activeTabMeta = media.tabs.find(t => t.id === activeTab) ?? null
  const activeTabLabel = activeTabMeta?.label ?? null
  const activeTabMessage = activeTabMeta?.comingSoonMessage ?? null

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
                Devlogs, build series, and mini-docs from the workshop.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
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
                → SUBSCRIBE — @loudd
              </a>
              <a
                href={media.docsChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wider)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  whiteSpace: 'nowrap',
                }}
              >
                → SUBSCRIBE — @loudddocs
              </a>
            </div>
          </div>

          {/* Featured video */}
          {featuredVideo && (
            <FeaturedVideo video={featuredVideo} channelUrl={media.channelUrl} />
          )}

          {/* Tab filter */}
          <SeriesFilterTabs active={activeTab} onChange={setActiveTab} />

          {/* Video grid or coming soon */}
          {filteredVideos.length > 0 ? (
            <VideoGrid videos={filteredVideos} onPlay={setPlayingVideo} />
          ) : (
            <ComingSoon tabLabel={activeTabLabel} message={activeTabMessage} />
          )}

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

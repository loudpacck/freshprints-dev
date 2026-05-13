import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { media, getVideosForTab, getThumbnailUrl, getThumbnailFallbackUrl, getEmbedUrl } from '@/data/media'
import { socialLinks } from '@/data/socialLinks'
import { useTheme } from '@/themes/useTheme'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'

function VideoLightboxModal({ video, onClose }) {
  const reduced = useReducedMotion()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

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
          background: 'rgba(0,0,0,0.92)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
        }}
      >
        <motion.div
          initial={reduced ? {} : { scale: 0.95 }}
          animate={{ scale: 1 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 960,
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: -48,
              right: 0,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: 36,
              height: 36,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              zIndex: 1,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <iframe
              src={getEmbedUrl(video.id)}
              title={video.title}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

function VideoThumbnail({ video, onPlay }) {
  const [imgSrc, setImgSrc] = useState(() => getThumbnailUrl(video.id))
  const [level, setLevel] = useState(0)
  const reduced = useReducedMotion()

  function handleError() {
    if (level === 0) {
      setImgSrc(getThumbnailFallbackUrl(video.id))
      setLevel(1)
    }
  }

  return (
    <motion.div
      onClick={() => onPlay(video)}
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
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={imgSrc}
          alt={video.title}
          onError={handleError}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Play overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0)',
          transition: 'background 200ms ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
        >
          <div style={{
            width: 48, height: 48,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" fill="#0A0A14"/>
            </svg>
          </div>
        </div>
        {/* Duration badge */}
        {video.duration && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 4,
            padding: '2px 6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: '#fff',
          }}>
            {video.duration}
          </div>
        )}
      </div>

      <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-snug)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {video.title}
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
          {video.description}
        </div>
      </div>
    </motion.div>
  )
}

function ComingSoon({ tabLabel, message, isRetro }) {
  if (isRetro) {
    return (
      <div style={{
        padding: 'var(--space-16) 0',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          background: 'var(--bg-elevated)',
          boxShadow: `inset 1px 1px 0 var(--bevel-highlight), inset -1px -1px 0 var(--bevel-dark), inset 2px 2px 0 var(--bevel-light), inset -2px -2px 0 var(--bevel-shadow)`,
          padding: 24,
          maxWidth: 380,
          width: '100%',
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #000080, #1084d0)',
            padding: '3px 8px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>📺</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {tabLabel ?? 'Videos'} — Coming Soon
            </span>
          </div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-primary)',
            margin: '0 0 16px',
            lineHeight: 1.6,
          }}>
            {message ?? 'Content is in production. Subscribe on YouTube to get notified when it drops.'}
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}>
            <a
              href={socialLinks.youtube.general.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'var(--bg-elevated)',
                boxShadow: `inset 1px 1px 0 var(--bevel-highlight), inset -1px -1px 0 var(--bevel-dark), inset 2px 2px 0 var(--bevel-light), inset -2px -2px 0 var(--bevel-shadow)`,
                border: 'none',
                padding: '4px 12px',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Subscribe
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-20) 0',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 'var(--radius-2xl)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto var(--space-6)',
        fontSize: 28,
      }}>
        🎬
      </div>
      <h3 style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 'var(--weight-semibold)',
        fontSize: 'var(--text-2xl)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-3)',
      }}>
        {tabLabel ? `${tabLabel} coming soon` : 'Videos coming soon'}
      </h3>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-base)',
        color: 'var(--text-secondary)',
        maxWidth: 480,
        margin: '0 auto',
        lineHeight: 'var(--leading-normal)',
      }}>
        {message ?? 'Content is in production. Subscribe to get notified when it drops.'}
      </p>
    </div>
  )
}

function NewsletterStrip() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const copy = media.newsletterCopy

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'newsletter', email }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section style={{
      background: 'var(--bg-elevated)',
      padding: 'var(--space-12) 0',
      borderTop: '1px solid var(--border-subtle)',
    }}>
      <div className="s-container">
        <Reveal>
          <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              marginBottom: 'var(--space-3)',
            }}>
              {copy.eyebrow}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-3xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-3)',
            }}>
              {copy.heading}
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-normal)',
              marginBottom: 'var(--space-6)',
            }}>
              {copy.body}
            </p>
            {status === 'success' ? (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: '#22C55E' }}>
                {copy.success}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-3)', maxWidth: 400, margin: '0 auto' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    flex: 1,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-3)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />
                <StandardButton type="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? '…' : copy.cta}
                </StandardButton>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default function StandardMedia() {
  const reduced = useReducedMotion()
  const { themeId } = useTheme()
  const isRetro = themeId === 'retro'
  const [activeTab, setActiveTab] = useState('all')
  const [playingVideo, setPlayingVideo] = useState(null)

  const TABS = [
    { id: 'all', label: 'All Videos' },
    ...media.tabs.map(t => ({ id: t.id, label: t.label })),
  ]

  const filteredVideos = getVideosForTab(activeTab)
  const featuredVideo = media.featuredVideoId
    ? media.videos.find(v => v.id === media.featuredVideoId) ?? null
    : null

  const activeTabMeta = media.tabs.find(t => t.id === activeTab) ?? null
  const activeTabLabel = activeTabMeta?.label ?? null
  const activeTabMessage = activeTabMeta?.comingSoonMessage ?? null

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
              // MEDIA
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
              Videos &amp; Documentation
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: 560,
              lineHeight: 'var(--leading-normal)',
              marginBottom: 'var(--space-6)',
            }}>
              Devlogs, build series, and mini-documentaries.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <StandardButton variant="secondary" href={socialLinks.youtube.general.url} target="_blank" rel="noopener noreferrer">
                Subscribe — {socialLinks.youtube.general.handle}
              </StandardButton>
              <StandardButton variant="ghost" href={socialLinks.youtube.docs.url} target="_blank" rel="noopener noreferrer">
                Mini Docs — {socialLinks.youtube.docs.handle}
              </StandardButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured video */}
      {featuredVideo && (
        <section className="s-section" style={{ background: 'var(--bg-base)' }}>
          <div className="s-container">
            <Reveal>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                marginBottom: 'var(--space-6)',
              }}>
                Featured
              </div>
              <div
                onClick={() => setPlayingVideo(featuredVideo)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-2xl)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-xl)',
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg-elevated)' }}>
                  <img
                    src={getThumbnailUrl(featuredVideo.id)}
                    alt={featuredVideo.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.src = getThumbnailFallbackUrl(featuredVideo.id) }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.25)',
                  }}>
                    <div style={{
                      width: 72, height: 72,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.95)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <polygon points="5 3 19 12 5 21 5 3" fill="#0A0A14"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: 'var(--space-6)',
                  background: 'var(--bg-card)',
                }}>
                  <h2 style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 'var(--weight-semibold)',
                    fontSize: 'var(--text-2xl)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-2)',
                  }}>
                    {featuredVideo.title}
                  </h2>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--leading-normal)',
                  }}>
                    {featuredVideo.description}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Tab filter */}
      <div style={{
        position: 'sticky',
        top: 'var(--nav-height)',
        zIndex: 10,
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div className="s-container" style={{ padding: 0 }}>
          <div style={{ display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer',
                  padding: 'var(--space-4) var(--space-5)',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video grid or coming soon */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={reduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {filteredVideos.length > 0 ? (
                <div className="s-grid-3">
                  {filteredVideos.map((video, i) => (
                    <Reveal key={video.id} delay={i * 0.04}>
                      <VideoThumbnail video={video} onPlay={setPlayingVideo} />
                    </Reveal>
                  ))}
                </div>
              ) : (
                <ComingSoon tabLabel={activeTabLabel} message={activeTabMessage} isRetro={isRetro} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <NewsletterStrip />

      {playingVideo && (
        <VideoLightboxModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </motion.div>
  )
}

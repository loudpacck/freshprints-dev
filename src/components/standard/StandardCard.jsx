import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useTheme } from '@/themes/useTheme'

export default function StandardCard({
  image,
  eyebrow,
  title,
  description,
  href,
  status,
  external = false,
  accentColor,   // optional: category color for the top hairline accent
  metric,        // optional: { label, value } shown as a mono stat chip
}) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const { themeId } = useTheme()
  // Phase 8 restraint (no hover-lift, plain status label) applies to Standard.
  // Retro and Funky render this same component inside their own chrome and keep
  // the original treatment — see the Retro/Funky notes in CLAUDE.md.
  const isStandard = themeId === 'standard'
  const [imgFailed, setImgFailed] = useState(false)
  const [hover, setHover] = useState(false)

  function handleClick() {
    if (external && href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else if (href) {
      navigate(href)
    }
  }

  // Status colors resolve through the per-theme --color-status-* tokens, which
  // every theme's tokens.css defines. Same map shape as the other three status
  // locations (Badge, StandardPortfolio, StandardProjectPage) — keep in sync.
  const STATUS_DOT = {
    ACTIVE:         'var(--color-status-active)',
    BETA:           'var(--color-status-beta)',
    STABLE:         'var(--color-status-stable)',
    PROFESSIONAL:   'var(--color-status-stable)',
    CONCEPT:        'var(--color-status-concept)',
    RESEARCH:       'var(--color-status-concept)',
    PRODUCTION:     'var(--color-status-active)',
    IN_DEVELOPMENT: 'var(--color-status-in-development)',
    AVAILABLE:      'var(--color-status-available)',
  }
  const STATUS_DOT_EXTRA = {
    AVAILABLE: {
      boxShadow: 'var(--status-available-glow, 0 0 6px rgba(255,255,255,0.6))',
      border: 'var(--status-available-border, 1px solid rgba(180,180,180,0.4))',
    },
  }
  const dotColor = STATUS_DOT[status] || 'var(--color-status-stable)'
  const dotExtra = STATUS_DOT_EXTRA[status] || {}

  return (
    <motion.div
      onClick={handleClick}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      whileHover={(reduced || isStandard) ? {} : { y: -4, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid',
        // Standard: hover darkens the border and nothing else.
        borderColor: hover && !reduced
          ? (isStandard ? 'var(--text-secondary)' : 'var(--border-accent)')
          : 'var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: isStandard ? 'none' : 'var(--shadow-sm)',
        overflow: 'hidden',
        cursor: href ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color var(--duration-fast) var(--ease-standard)',
      }}
    >
      {/* Category accent hairline */}
      {accentColor && (
        <div style={{ height: '2px', background: accentColor, flexShrink: 0 }} />
      )}

      {/* Image area */}
      <div style={{
        aspectRatio: '16/10',
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {image && !imgFailed ? (
          <motion.img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            animate={(reduced || isStandard) ? {} : { scale: hover ? 1.03 : 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: isStandard
              ? 'var(--bg-elevated)'
              : 'linear-gradient(135deg, var(--accent-muted) 0%, var(--bg-elevated) 100%)',
          }} />
        )}
        {status && (
          <div style={{
            position: 'absolute',
            top: 'var(--space-3)',
            right: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            // Standard: a square label plate with a colored dot — not a
            // blurred, rounded pill. It sits over a photo, so it keeps an
            // opaque ground; the decoration is what goes, not the legibility.
            background: isStandard ? 'var(--bg-card)' : 'var(--bg-overlay)',
            backdropFilter: isStandard ? 'none' : 'blur(8px)',
            WebkitBackdropFilter: isStandard ? 'none' : 'blur(8px)',
            borderRadius: isStandard ? 0 : '999px',
            padding: isStandard ? '3px var(--space-2)' : 'var(--space-1) var(--space-3)',
            border: isStandard ? 'none' : '1px solid var(--border-subtle)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, ...dotExtra }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wide)',
            }}>
              {status.replace(/_/g, ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {eyebrow && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--label-size)',
            color: accentColor || 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--label-tracking)',
          }}>
            {eyebrow}
          </div>
        )}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--display-sm)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-snug)',
          letterSpacing: 'var(--tracking-tight)',
        }}>
          {title}
        </div>
        {description && (
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
            {description}
          </div>
        )}

        {/* Footer row: metric (optional) + view affordance */}
        {(metric || href) && (
        <div style={{
          marginTop: 'auto',
          paddingTop: 'var(--space-3)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          borderTop: metric ? '1px solid var(--hairline)' : 'none',
        }}>
          {metric ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--text-primary)',
                lineHeight: 1,
                letterSpacing: 'var(--tracking-tight)',
              }}>
                {metric.value}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
              }}>
                {metric.label}
              </span>
            </div>
          ) : <span />}
          {href && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--accent-ink, var(--accent))',
              whiteSpace: 'nowrap',
            }}>
              View →
            </span>
          )}
        </div>
        )}
      </div>
    </motion.div>
  )
}

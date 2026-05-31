import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'

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
  const [imgFailed, setImgFailed] = useState(false)
  const [hover, setHover] = useState(false)

  function handleClick() {
    if (external && href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else if (href) {
      navigate(href)
    }
  }

  // Status colors — kept as literal hexes to stay in sync with the documented
  // 4-location status map (Badge, StandardCard, StandardPortfolio, StandardProjectPage).
  const STATUS_DOT = {
    ACTIVE:         '#22C55E',
    BETA:           '#F59E0B',
    STABLE:         'var(--accent)',
    CONCEPT:        '#8B5CF6',
    PRODUCTION:     '#22C55E',
    IN_DEVELOPMENT: '#F59E0B',
    AVAILABLE:      '#FFFFFF',
  }
  const STATUS_DOT_EXTRA = {
    AVAILABLE: { boxShadow: '0 0 6px rgba(255,255,255,0.6)', border: '1px solid rgba(180,180,180,0.4)' },
  }
  const dotColor = STATUS_DOT[status] || 'var(--accent)'
  const dotExtra = STATUS_DOT_EXTRA[status] || {}

  return (
    <motion.div
      onClick={handleClick}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      whileHover={reduced ? {} : { y: -4, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid',
        borderColor: hover && !reduced ? 'var(--border-accent)' : 'var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
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
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            animate={reduced ? {} : { scale: hover ? 1.03 : 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, var(--accent-muted) 0%, var(--bg-elevated) 100%)',
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
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '999px',
            padding: 'var(--space-1) var(--space-3)',
            border: '1px solid var(--border-subtle)',
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
              color: 'var(--accent)',
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

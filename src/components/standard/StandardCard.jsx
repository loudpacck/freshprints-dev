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
}) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [imgFailed, setImgFailed] = useState(false)

  function handleClick() {
    if (external && href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else if (href) {
      navigate(href)
    }
  }

  const STATUS_DOT = {
    ACTIVE:  '#22C55E',
    BETA:    '#F59E0B',
    STABLE:  'var(--accent)',
    CONCEPT: '#8B5CF6',
  }
  const dotColor = STATUS_DOT[status] || 'var(--accent)'

  return (
    <motion.div
      onClick={handleClick}
      whileHover={reduced ? {} : { y: -2, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        cursor: href ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 200ms ease',
      }}
    >
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
            whileHover={reduced ? {} : { scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
            top: '0.75rem',
            right: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(8px)',
            borderRadius: '999px',
            padding: '0.25rem 0.625rem',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {status}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {eyebrow && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
          }}>
            {eyebrow}
          </div>
        )}
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-snug)',
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
        {href && (
          <div style={{
            marginTop: 'auto',
            paddingTop: 'var(--space-3)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--accent)',
          }}>
            View →
          </div>
        )}
      </div>
    </motion.div>
  )
}

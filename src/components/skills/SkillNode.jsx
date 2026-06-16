import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const PROFICIENCY_COLORS = {
  PRODUCTION:   '#22C55E',
  PROFESSIONAL: '#00C8FF',
  ACTIVE:       '#F59E0B',
}

export const STATUS_DOT = {
  ACTIVE:         '#22C55E',
  PRODUCTION:     '#22C55E',
  BETA:           '#F59E0B',
  IN_DEVELOPMENT: '#F59E0B',
  STABLE:         '#00C8FF',
  AVAILABLE:      '#FFFFFF',
  CONCEPT:        '#8B5CF6',
  RESEARCH:       '#8B5CF6',
}

const HEX_W = 92
const HEX_H = 80
const HEX_POINTS = [
  [HEX_W * 0.25, 0],
  [HEX_W * 0.75, 0],
  [HEX_W,        HEX_H * 0.5],
  [HEX_W * 0.75, HEX_H],
  [HEX_W * 0.25, HEX_H],
  [0,            HEX_H * 0.5],
].map(p => p.join(',')).join(' ')

export default function SkillNode({
  type,
  data,
  isSelected = false,
  isDimmed = false,
  disciplineColor,
  onClick,
  nodeRef,
  reduced = false,
}) {
  if (type === 'discipline') {
    return (
      <motion.div
        ref={nodeRef}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Select ${data.label}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
        animate={{ opacity: isDimmed ? 0.3 : 1 }}
        transition={{ duration: reduced ? 0 : 0.2 }}
        style={{
          position: 'relative',
          width: HEX_W,
          height: HEX_H,
          cursor: 'pointer',
          flexShrink: 0,
          outline: 'none',
        }}
        whileHover={reduced ? {} : { scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
      >
        <svg width={HEX_W} height={HEX_H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <polygon
            points={HEX_POINTS}
            fill={isSelected ? `${data.color}1A` : 'var(--color-bg-surface)'}
            stroke={isSelected ? data.color : `${data.color}55`}
            strokeWidth={isSelected ? 2 : 1}
            style={{ transition: 'all 200ms' }}
          />
          {isSelected && (
            <polygon
              points={HEX_POINTS}
              fill="none"
              stroke={data.color}
              strokeWidth={3}
              strokeOpacity={0.25}
              style={{ filter: `drop-shadow(0 0 8px ${data.color}90)` }}
            />
          )}
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          padding: 'var(--space-2)',
          pointerEvents: 'none',
        }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isSelected ? data.color : `${data.color}88`,
              transition: 'background 200ms',
              flexShrink: 0,
            }}
          />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.58rem',
            fontWeight: 'var(--weight-medium)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: isSelected ? data.color : 'var(--color-text-secondary)',
            textAlign: 'center',
            lineHeight: 1.25,
            transition: 'color 200ms',
          }}>
            {data.label}
          </span>
        </div>
      </motion.div>
    )
  }

  if (type === 'tool') {
    const profColor = PROFICIENCY_COLORS[data.proficiency] ?? 'var(--color-text-muted)'
    const color = disciplineColor ?? 'var(--color-accent-primary)'

    return (
      <motion.div
        ref={nodeRef}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`View ${data.label} details`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4)',
          background: isSelected ? `${color}18` : 'var(--color-bg-surface)',
          border: `1px solid ${isSelected ? color : 'var(--color-border-subtle)'}`,
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'background 150ms, border-color 150ms',
          minWidth: 100,
        }}
        whileHover={reduced ? {} : { scale: 1.04, borderColor: color }}
        whileTap={{ scale: 0.97 }}
      >
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)',
          color: isSelected ? color : 'var(--color-text-secondary)',
          flex: 1,
          whiteSpace: 'nowrap',
          transition: 'color 150ms',
        }}>
          {data.label}
        </span>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: profColor,
          flexShrink: 0,
        }} />
      </motion.div>
    )
  }

  if (type === 'specialization') {
    const color = disciplineColor ?? 'var(--color-border-default)'
    return (
      <motion.div
        ref={nodeRef}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Select ${data.label}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: 'var(--space-1) var(--space-3)',
          background: isSelected ? `${color}1A` : `${color}0D`,
          border: `1px solid ${isSelected ? color : `${color}33`}`,
          borderRadius: 'var(--radius-full)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: isSelected ? color : 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          outline: 'none',
          transition: 'background 150ms, border-color 150ms, color 150ms',
        }}
        whileHover={reduced ? {} : { scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        {data.label}
      </motion.div>
    )
  }

  if (type === 'project') {
    const dotColor = STATUS_DOT[data.status] ?? '#9090A8'
    const color = disciplineColor ?? 'var(--color-accent-primary)'
    return (
      <motion.div
        ref={nodeRef}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`View ${data.name} usage`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4)',
          background: isSelected ? `${color}18` : 'var(--color-bg-surface)',
          border: `1px solid ${isSelected ? color : 'var(--color-border-subtle)'}`,
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'background 150ms, border-color 150ms',
          minWidth: 100,
        }}
        whileHover={reduced ? {} : { scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
          ...(data.status === 'AVAILABLE' ? {
            boxShadow: '0 0 6px rgba(255,255,255,0.6)',
            outline: '1px solid rgba(180,180,180,0.4)',
          } : {}),
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)',
          color: isSelected ? color : 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
          transition: 'color 150ms',
        }}>
          {data.name}
        </span>
      </motion.div>
    )
  }

  if (type === 'usage') {
    // data = { projectName, projectSlug, usageText }
    const color = disciplineColor ?? 'var(--color-accent-primary)'
    return (
      <div
        ref={nodeRef}
        style={{
          padding: 'var(--space-4) var(--space-5)',
          background: 'var(--color-bg-surface)',
          border: `1px solid ${color}33`,
          borderRadius: 'var(--radius-sm)',
          maxWidth: 420,
        }}
      >
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color,
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
          marginBottom: 'var(--space-2)',
        }}>
          {data.projectName}
        </div>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          lineHeight: 'var(--leading-relaxed)',
          margin: '0 0 var(--space-3) 0',
        }}>
          {data.usageText}
        </p>
        <Link
          to={`/portfolio/${data.projectSlug}`}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color,
            textDecoration: 'none',
            letterSpacing: 'var(--tracking-wide)',
          }}
        >
          View project ↗
        </Link>
      </div>
    )
  }

  return null
}

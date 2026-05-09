import { motion } from 'framer-motion'

const PROFICIENCY_COLORS = {
  PRODUCTION:   '#22C55E',
  PROFESSIONAL: '#00C8FF',
  ACTIVE:       '#F59E0B',
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

  // specialization pill
  const color = disciplineColor ?? 'var(--color-border-default)'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: 'var(--space-1) var(--space-3)',
      background: `${color}0D`,
      border: `1px solid ${color}33`,
      borderRadius: 'var(--radius-full)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wide)',
      whiteSpace: 'nowrap',
    }}>
      {data.label}
    </span>
  )
}

import { motion } from 'framer-motion'
import { useTheme } from '@/themes/useTheme'
import { getTheme } from '@/themes/registry'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useSound } from '@/sound/useSound'

// Swatch identity per theme (matches the UIPicker mini-previews).
const THEME_TILES = [
  { id: 'standard', accent: '#1E3C64', bg: '#FFFFFF' },
  { id: 'digital',  accent: '#00C8FF', bg: '#0A0A0F' },
  { id: 'retro',    accent: '#000080', bg: '#C0C0C0' },
  { id: 'funky',    accent: '#BFFF00', bg: '#12041F' },
  { id: 'pantheon', accent: '#C9A961', bg: '#0A0710' },
]

// Win95 bevels for the retro tiles (same idiom as RetroButton).
const RETRO_RAISED = `
  inset 1px 1px 0 var(--bevel-highlight),
  inset -1px -1px 0 var(--bevel-dark),
  inset 2px 2px 0 var(--bevel-light),
  inset -2px -2px 0 var(--bevel-shadow)
`.trim()
const RETRO_INSET = `
  inset 1px 1px 0 var(--bevel-dark),
  inset -1px -1px 0 var(--bevel-highlight),
  inset 2px 2px 0 var(--bevel-shadow),
  inset -2px -2px 0 var(--bevel-light)
`.trim()

// Token vocabulary differs: digital uses --color-*, the others use the
// Standard-native names (bridged under retro/funky).
function resolveTokens(isDigital) {
  return isDigital
    ? {
        surface: 'var(--color-bg-surface)',
        border: 'var(--color-border-subtle)',
        radius: 'var(--radius-md)',
        textPrimary: 'var(--color-text-primary)',
        textMuted: 'var(--color-text-muted)',
        accent: 'var(--color-accent-primary)',
        nameFont: 'var(--font-mono)',
        nameTransform: 'uppercase',
        nameSpacing: 'var(--tracking-wide)',
      }
    : {
        surface: 'var(--bg-card)',
        border: 'var(--border-subtle)',
        radius: 'var(--radius-lg)',
        textPrimary: 'var(--text-primary)',
        textMuted: 'var(--text-tertiary)',
        accent: 'var(--accent)',
        nameFont: 'var(--font-body)',
        nameTransform: 'none',
        nameSpacing: 'var(--tracking-tight)',
      }
}

function Tile({ tile, themeId, tokens, finePointer, reduced, onSelect, play }) {
  const manifest = getTheme(tile.id)
  const comingSoon = manifest.comingSoon === true
  const isActive = themeId === tile.id
  const isRetro = themeId === 'retro'

  function handleClick() {
    if (comingSoon || isActive) return
    play(themeId === 'retro' ? 'click' : 'select')
    onSelect(tile.id)
  }
  function handleEnter() {
    if (comingSoon) return
    play('hover')
  }

  const baseStyle = {
    position: 'relative',
    textAlign: 'left',
    padding: 'var(--space-5)',
    width: 216,
    maxWidth: '100%',
    background: isRetro ? 'var(--bg-elevated)' : tokens.surface,
    border: isRetro ? 'none' : `1px solid ${isActive ? tokens.accent : tokens.border}`,
    borderRadius: isRetro ? 0 : tokens.radius,
    boxShadow: isRetro
      ? RETRO_RAISED
      : isActive
      ? `0 0 0 1px ${tokens.accent}`
      : 'none',
    cursor: comingSoon ? 'not-allowed' : isActive ? 'default' : 'pointer',
    opacity: comingSoon ? 0.55 : 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    userSelect: 'none',
  }

  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          aria-hidden="true"
          style={{
            width: 20,
            height: 20,
            borderRadius: isRetro ? 0 : '50%',
            background: tile.bg,
            border: `2px solid ${tile.accent}`,
            flexShrink: 0,
            boxShadow: isRetro ? RETRO_INSET : 'none',
          }}
        />
        {comingSoon ? (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: tile.accent,
              border: `1px solid ${tile.accent}66`,
              borderRadius: isRetro ? 0 : 3,
              padding: '1px 5px',
            }}
          >
            Soon
          </span>
        ) : isActive ? (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: tokens.accent,
            }}
          >
            ● Active
          </span>
        ) : null}
      </div>
      <div
        style={{
          fontFamily: tokens.nameFont,
          fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--text-base)',
          color: tokens.textPrimary,
          textTransform: tokens.nameTransform,
          letterSpacing: tokens.nameSpacing,
        }}
      >
        {manifest.label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: tokens.textMuted,
          lineHeight: 'var(--leading-normal)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {manifest.description}
      </div>
    </>
  )

  // Retro tiles depress like real 95 buttons — no motion lift, bevel flips
  // to inset on press. No glow. Uses the retro click sound (in handleClick).
  if (isRetro) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={handleEnter}
        disabled={comingSoon}
        style={baseStyle}
        onMouseDown={e => {
          if (comingSoon || isActive) return
          e.currentTarget.style.boxShadow = RETRO_INSET
          e.currentTarget.style.transform = 'translate(1px, 1px)'
        }}
        onMouseUp={e => {
          if (comingSoon) return
          e.currentTarget.style.boxShadow = RETRO_RAISED
          e.currentTarget.style.transform = ''
        }}
        onMouseLeave={e => {
          if (comingSoon) return
          e.currentTarget.style.boxShadow = RETRO_RAISED
          e.currentTarget.style.transform = ''
        }}
      >
        {content}
      </button>
    )
  }

  // Per-theme hover / press expressed in framer-motion. Hover only fires on
  // fine pointers; reduced-motion drops all transforms/glow.
  const canHover = finePointer && !reduced && !comingSoon && !isActive
  let whileHover = {}
  let whileTap = {}
  let transition = { duration: 0.18 }

  if (themeId === 'digital') {
    // Neon glow + crisp lift.
    whileHover = canHover
      ? {
          y: -4,
          borderColor: tokens.accent,
          boxShadow: `0 0 0 1px ${tokens.accent}, 0 0 22px rgba(0, 200, 255, 0.35)`,
        }
      : {}
    whileTap = comingSoon || reduced ? {} : { scale: 0.97 }
  } else if (themeId === 'funky') {
    // Springy squish/bounce + playful lift, liquid spring easing.
    whileHover = canHover ? { y: -5, scale: 1.04, rotate: -1 } : {}
    whileTap = comingSoon || reduced ? {} : { scale: 0.9 }
    transition = { type: 'spring', stiffness: 420, damping: 16 }
  } else {
    // Standard — refined lift + soft shadow bloom, restrained.
    whileHover = canHover
      ? { y: -4, borderColor: 'var(--border-accent)', boxShadow: 'var(--shadow-lg)' }
      : {}
    whileTap = comingSoon || reduced ? {} : { scale: 0.98 }
  }

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={handleEnter}
      disabled={comingSoon}
      style={baseStyle}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={transition}
    >
      {content}
    </motion.button>
  )
}

export default function HireThemeTiles() {
  const { themeId, setTheme } = useTheme()
  const reduced = useReducedMotion()
  const { play } = useSound()
  const isDigital = themeId === 'digital'
  const tokens = resolveTokens(isDigital)
  const finePointer =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(pointer: fine)').matches
      : true

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        maxWidth: 760,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {THEME_TILES.map(tile => (
        <Tile
          key={tile.id}
          tile={tile}
          themeId={themeId}
          tokens={tokens}
          finePointer={finePointer}
          reduced={reduced}
          onSelect={setTheme}
          play={play}
        />
      ))}
    </div>
  )
}

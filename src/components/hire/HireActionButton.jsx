import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/themes/useTheme'
import Button from '@/components/ui/Button'
import StandardButton from '@/components/standard/StandardButton'
import RetroButton from '@/components/retro/RetroButton'
import FunkyButton from '@/components/funky/FunkyButton'

/**
 * One button, four native idioms. The hire page renders the SAME action across
 * every theme, so this dispatches to each theme's own button component — that
 * way the press feel and sound stay authentic to the active interface:
 *   - digital → neon-glow Button (cyan halo + crisp press)
 *   - standard → refined lift StandardButton
 *   - retro   → Win95 bevel RetroButton (inset flip on press + retro click)
 *   - funky   → springy liquid FunkyButton (squish + color shift)
 *
 * Interactivity, hover gating and reduced-motion are all handled inside those
 * components already, so this stays a thin normalizing wrapper.
 */
export default function HireActionButton({
  children,
  url,
  isExternal = false,
  variant = 'primary',
  size = 'md',
  style,
}) {
  const navigate = useNavigate()
  const { themeId } = useTheme()

  function handleClick() {
    if (isExternal) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      navigate(url)
    }
  }

  if (themeId === 'digital') {
    return (
      <Button variant={variant} size={size} glow onClick={handleClick} style={style}>
        {children}
      </Button>
    )
  }

  if (themeId === 'retro') {
    const rv = variant === 'primary' ? 'primary' : 'default'
    const rStyle =
      size === 'lg'
        ? { padding: '8px 22px', minHeight: 34, fontSize: 'var(--text-lg)', ...style }
        : style
    return (
      <RetroButton variant={rv} onClick={handleClick} style={rStyle}>
        {children}
      </RetroButton>
    )
  }

  if (themeId === 'funky') {
    const fStyle =
      size === 'lg'
        ? { padding: '0.9rem 2rem', fontSize: 'var(--text-lg)', ...style }
        : style
    return (
      <FunkyButton variant={variant} onClick={handleClick} style={fStyle}>
        {children}
      </FunkyButton>
    )
  }

  // standard (also the default fallback)
  return (
    <StandardButton variant={variant} size={size} onClick={handleClick} style={style}>
      {children}
    </StandardButton>
  )
}

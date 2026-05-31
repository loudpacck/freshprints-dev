/* Optical-illusion section divider — purely decorative, aria-hidden.
   Low-contrast moiré (concentric rings) or soft wave bands in the palette,
   edge-masked so it reads as an accent break between sections, never a
   background behind body text. All motion lives in tokens.css and freezes
   under prefers-reduced-motion. */
export default function FunkyDivider({ variant = 'rings', style }) {
  return (
    <div
      className={`funky-divider${variant === 'waves' ? ' funky-divider--waves' : ''}`}
      aria-hidden="true"
      style={style}
    />
  )
}

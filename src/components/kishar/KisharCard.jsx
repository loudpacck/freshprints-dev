/**
 * Kishar card — a leather-dark panel inside a double frame (1px --border
 * outside, 1px --border-inner set in), with four small gilt corner marks
 * drawn as inline SVG paths and a grain overlay.
 *
 * Hover brightens the frame and the corner marks. Nothing moves.
 */

// One corner mark: a short right-angle with an inward tick. Rotated per corner.
function CornerMark({ position }) {
  const OFFSET = 9
  const place = {
    tl: { top: OFFSET, left: OFFSET, transform: 'rotate(0deg)' },
    tr: { top: OFFSET, right: OFFSET, transform: 'rotate(90deg)' },
    br: { bottom: OFFSET, right: OFFSET, transform: 'rotate(180deg)' },
    bl: { bottom: OFFSET, left: OFFSET, transform: 'rotate(270deg)' },
  }[position]

  return (
    <span className="kishar-card-corner" style={place} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M0.5 6.5V0.5H6.5" stroke="currentColor" strokeWidth="1" />
        <path d="M3 3l3 3" stroke="currentColor" strokeWidth="1" />
        <path d="M0.5 9.5V8" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <path d="M9.5 0.5H8" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      </svg>
    </span>
  )
}

export default function KisharCard({
  children,
  as: Tag = 'div',
  padding = 'var(--space-6)',
  corners = true,
  texture = 'leather',
  className = '',
  style,
  ...rest
}) {
  const texClass = texture ? `k-tex-${texture}` : ''
  return (
    <Tag
      className={`kishar-card ${texClass} ${className}`.trim()}
      style={style}
      {...rest}
    >
      {corners && (
        <>
          <CornerMark position="tl" />
          <CornerMark position="tr" />
          <CornerMark position="br" />
          <CornerMark position="bl" />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 1, padding }}>
        {children}
      </div>
    </Tag>
  )
}

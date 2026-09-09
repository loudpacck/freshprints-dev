/**
 * A section break: a thin gold rule that tapers to nothing at both ends with a
 * small lozenge at centre. Inline SVG so the taper is real geometry rather than
 * a mask, and so it takes --gold via currentColor.
 *
 * Decorative only — aria-hidden, no motion.
 */
export default function KisharSectionRule({ width = '100%', margin = 'var(--space-10) 0', style }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        margin,
        color: 'var(--gold)',
        lineHeight: 0,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 600 16"
        preserveAspectRatio="none"
        width="100%"
        height="16"
        fill="none"
        focusable="false"
      >
        {/* Tapered rules: a thin wedge on each side of the lozenge. */}
        <path d="M8 8.5 L272 7.6 L272 8.4 Z" fill="currentColor" opacity="0.9" />
        <path d="M592 8.5 L328 7.6 L328 8.4 Z" fill="currentColor" opacity="0.9" />
        {/* Hairline continuation so the rule reads as one line, not two darts. */}
        <path d="M8 8h264M328 8h264" stroke="currentColor" strokeWidth="0.6" opacity="0.45" />
        {/* Centre lozenge, with an inner facet for a struck-metal read. */}
        <path d="M300 1.5 L308 8 L300 14.5 L292 8 Z" fill="currentColor" />
        <path d="M300 4.5 L304.5 8 L300 11.5 L295.5 8 Z" fill="var(--bg-base)" opacity="0.55" />
        {/* Flanking studs. */}
        <circle cx="278" cy="8" r="1.6" fill="currentColor" opacity="0.8" />
        <circle cx="322" cy="8" r="1.6" fill="currentColor" opacity="0.8" />
      </svg>
    </div>
  )
}

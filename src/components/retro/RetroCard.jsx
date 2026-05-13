const RAISED = `
  inset 1px 1px 0 var(--bevel-highlight),
  inset -1px -1px 0 var(--bevel-dark),
  inset 2px 2px 0 var(--bevel-light),
  inset -2px -2px 0 var(--bevel-shadow)
`.trim()

export default function RetroCard({ title, titleActive = true, children, style = {}, contentStyle = {} }) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: RAISED,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            height: 20,
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: titleActive
              ? `linear-gradient(to right, var(--titlebar-active-start), var(--titlebar-active-end))`
              : 'var(--titlebar-inactive)',
            userSelect: 'none',
          }}
        >
          {/* Tiny icon placeholder */}
          <div style={{
            width: 10,
            height: 10,
            background: '#FFFF00',
            border: '1px solid #808080',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </span>
        </div>
      )}
      <div style={{ padding: 'var(--space-5)', flex: 1, ...contentStyle }}>
        {children}
      </div>
    </div>
  )
}

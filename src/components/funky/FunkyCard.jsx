/* Organic, morphing card. Corners swell and the offset shadow shifts color
   on hover (all in the .funky-card CSS treatment). Body content stays clean
   and readable — only the container is wild. */
export default function FunkyCard({ children, onClick, style, ...rest }) {
  return (
    <div
      className="funky-card"
      onClick={onClick}
      style={{
        padding: 'var(--space-6)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

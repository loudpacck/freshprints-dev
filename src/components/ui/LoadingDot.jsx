export default function LoadingDot({
  size = 8,
  color = 'var(--color-accent-primary)',
  gap = 'var(--space-2)',
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: color,
            display: 'block',
            animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

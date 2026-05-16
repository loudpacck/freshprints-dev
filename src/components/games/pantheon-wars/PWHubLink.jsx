import { Link } from 'react-router-dom'

export default function PWHubLink() {
  return (
    <Link
      to="/hub"
      style={{
        position: 'fixed',
        bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        left: 'calc(20px + env(safe-area-inset-left, 0px))',
        zIndex: 9,
        fontFamily: "var(--pw-font-display, 'Cinzel', serif)",
        fontSize: 9,
        fontWeight: 400,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
        textDecoration: 'none',
        transition: 'color 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent-gold-dim)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
    >
      ← HUB
    </Link>
  )
}

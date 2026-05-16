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
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'rgba(240,240,248,0.2)',
        textDecoration: 'none',
        transition: 'color 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.2)' }}
    >
      ← HUB
    </Link>
  )
}

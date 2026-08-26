import { useNavigate } from 'react-router-dom'
import { socialLinks } from '@/data/socialLinks'
import { UTILITY_NAV } from '@/data/navigation'
import { useSound } from '@/sound/useSound'

const RAISED = `
  inset 1px 1px 0 var(--bevel-highlight),
  inset -1px -1px 0 var(--bevel-dark),
  inset 2px 2px 0 var(--bevel-light),
  inset -2px -2px 0 var(--bevel-shadow)
`.trim()

const CONNECT_LINKS = [
  { label: 'Email',               href: `mailto:${socialLinks.email}` },
  { label: 'LinkedIn',            href: socialLinks.linkedin.url },
  { label: 'GitHub',              href: socialLinks.github.url },
  { label: 'YouTube',             href: socialLinks.youtube.general.url },
  { label: 'YouTube — Mini Docs', href: socialLinks.youtube.docs.url },
]

const heading = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-primary)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--label-tracking)',
  marginBottom: 'var(--space-3)',
}

const linkStyle = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--text-link, var(--accent))',
  textDecoration: 'underline',
  background: 'none',
  border: 'none',
  padding: 0,
  marginBottom: 'var(--space-2)',
  cursor: 'pointer',
  textAlign: 'left',
}

export default function RetroFooter() {
  const navigate = useNavigate()
  const { play } = useSound()
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        maxWidth: 1280,
        width: '100%',
        margin: '0 auto 12px',
        padding: 'var(--space-5)',
        background: 'var(--bg-elevated)',
        boxShadow: RAISED,
      }}
    >
      <div
        className="retro-footer-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-6)',
        }}
      >
        {/* More */}
        <div>
          <div style={heading}>More</div>
          {UTILITY_NAV.map(({ id, label, href }) => (
            <button
              key={id}
              onClick={() => { play('click'); navigate(href) }}
              onMouseEnter={() => play('hover')}
              style={linkStyle}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Connect */}
        <div>
          <div style={heading}>Connect</div>
          {CONNECT_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              style={linkStyle}
              onMouseEnter={() => play('hover')}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 'var(--space-5)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--bevel-shadow)',
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        © {year} Kyle DeBord — All rights reserved
      </div>

      <style>{`
        @media (max-width: 640px) {
          [data-ui="retro"] .retro-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}

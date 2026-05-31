import { Link } from 'react-router-dom'
import { socialLinks } from '@/data/socialLinks'

const SITE_LINKS = [
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/lab',       label: 'Lab' },
  { to: '/store',     label: 'Store' },
  { to: '/media',     label: 'Media' },
  { to: '/skills',    label: 'Skills' },
]

const CONNECT_LINKS = [
  { label: 'Email',               href: `mailto:${socialLinks.email}` },
  { label: 'LinkedIn',            href: socialLinks.linkedin.url },
  { label: 'GitHub',              href: socialLinks.github.url },
  { label: 'YouTube',             href: socialLinks.youtube.general.url },
  { label: 'YouTube — Mini Docs', href: socialLinks.youtube.docs.url },
]

const heading = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--label-size)',
  color: 'var(--accent-turquoise)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--label-tracking)',
  marginBottom: 'var(--space-4)',
}
const linkStyle = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-tertiary)',
  textDecoration: 'none',
  paddingBottom: 'var(--space-3)',
  transition: 'color var(--duration-fast) var(--ease-smooth)',
}

export default function FunkyFooter({ onOpenPicker }) {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      position: 'relative',
      zIndex: 1,
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: 'var(--space-12)',
      marginTop: 'auto',
      background: 'var(--bg-surface)',
    }}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--space-8)' }}>
        <div className="funky-footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-10)',
        }}>
          {/* Brand */}
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-2xl)',
              background: 'var(--gradient-text)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'var(--accent)',
              marginBottom: 'var(--space-2)',
            }}>
              Fresh Prints
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              lineHeight: 'var(--leading-relaxed)',
            }}>
              Creative engineering across software, AI, hardware, and game systems.
            </p>
          </div>

          {/* Site */}
          <div>
            <div style={heading}>Site</div>
            {SITE_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={linkStyle}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
              >
                {label}
              </Link>
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
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: 'var(--space-5) 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-quaternary)',
            letterSpacing: 'var(--tracking-wide)',
          }}>
            © {year} Kyle DeBord — All rights reserved
          </span>
          <button
            onClick={onOpenPicker}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              letterSpacing: 'var(--tracking-wide)',
              cursor: 'pointer',
              transition: 'color var(--duration-fast) var(--ease-smooth)',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
          >
            Switch Interface →
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          [data-ui="funky"] .funky-footer-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          [data-ui="funky"] .funky-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}

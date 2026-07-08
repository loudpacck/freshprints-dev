import { Link } from 'react-router-dom'
import { socialLinks } from '@/data/socialLinks'

const SITE_LINKS = [
  { to: '/hire',   label: 'Hire Me' },
  { to: '/lab',    label: 'Lab' },
  { to: '/store',  label: 'Store' },
  { to: '/media',  label: 'Media' },
  { to: '/skills', label: 'Skills' },
]

const CONNECT_LINKS = [
  { label: 'Email',              href: `mailto:${socialLinks.email}` },
  { label: 'LinkedIn',           href: socialLinks.linkedin.url },
  { label: 'GitHub',             href: socialLinks.github.url },
  { label: 'YouTube',            href: socialLinks.youtube.general.url },
  { label: 'YouTube — Mini Docs', href: socialLinks.youtube.docs.url },
]

const col = {
  heading: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--label-size)',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--label-tracking)',
    marginBottom: 'var(--space-4)',
  },
  link: {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-tertiary)',
    textDecoration: 'none',
    paddingBottom: 'var(--space-3)',
    transition: 'color var(--duration-fast) var(--ease-standard)',
  },
}

export default function StandardFooter({ onOpenPicker }) {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: 'var(--space-12)',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: '0 var(--space-8)',
      }}>
        {/* 3-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-10)',
        }}
          className="s-footer-grid"
        >
          {/* Col 1 — Brand */}
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-1)',
            }}>
              Kyle DeBord
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--label-size)',
              color: 'var(--text-tertiary)',
              letterSpacing: 'var(--label-tracking)',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-4)',
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

          {/* Col 2 — Site */}
          <div>
            <div style={col.heading}>Site</div>
            {SITE_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={col.link}
                onMouseEnter={e => e.target.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Col 3 — Connect */}
          <div>
            <div style={col.heading}>Connect</div>
            {CONNECT_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                style={col.link}
                onMouseEnter={e => e.target.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
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
              transition: 'color var(--duration-fast) var(--ease-standard)',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
          >
            Switch to Operations Terminal →
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          [data-ui="standard"] .s-footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          [data-ui="standard"] .s-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  )
}

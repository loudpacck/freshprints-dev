import { Link, useNavigate } from 'react-router-dom'
import { socialLinks } from '@/data/socialLinks'
import { useTheme } from '@/themes/useTheme'

const SITE_LINKS = [
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
    fontSize: '0.65rem',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 'var(--space-4)',
  },
  link: {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-tertiary)',
    textDecoration: 'none',
    paddingBottom: 'var(--space-3)',
    transition: 'color 150ms ease',
  },
}

export default function StandardFooter({ onOpenPicker }) {
  const year = new Date().getFullYear()
  const { setTheme } = useTheme()
  const navigate = useNavigate()

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
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}>
              Kyle DeBord
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.06em',
              marginBottom: 'var(--space-4)',
            }}>
              Fresh Prints
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              lineHeight: 'var(--leading-relaxed)',
              maxWidth: 240,
            }}>
              Creative engineering across software, hardware, and game systems.
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
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-quaternary)',
          }}>
            © {year} Kyle DeBord · All rights reserved
          </span>
          <button
            onClick={() => { setTheme('digital'); navigate('/hub') }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
          >
            Switch to Operations Terminal →
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .s-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 960px) {
          .s-footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </footer>
  )
}

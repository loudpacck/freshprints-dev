import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { useTheme } from '@/themes/useTheme'
import { getTheme } from '@/themes/registry'
import { bottomCtas } from '@/data/hirePageData'
import { useHirePageStats } from '@/hooks/useHirePageStats'
import HireHeroDigital from '@/components/hire/HireHeroDigital'

const THEME_TILES = [
  { id: 'standard', accent: '#1E3C64', bg: '#FFFFFF' },
  { id: 'digital',  accent: '#00C8FF', bg: '#0A0A0F' },
  { id: 'retro',    accent: '#000080', bg: '#C0C0C0' },
  { id: 'funky',    accent: '#BFFF00', bg: '#12041F' },
  { id: 'pantheon', accent: '#C9A961', bg: '#0A0710' },
]

function ProjectRow({ project }) {
  const navigate = useNavigate()

  const actionButton = (
    <Button variant="primary" onClick={() => !project.isExternal && navigate(project.buttonUrl)}>
      {project.buttonLabel}
    </Button>
  )

  return (
    <div
      className="dh-row"
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div style={{ aspectRatio: '16/10', background: 'var(--color-bg-elevated)', overflow: 'hidden' }}>
        <img
          src={project.thumbnail}
          alt={project.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      </div>

      <div style={{ padding: 'var(--space-7)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--space-2)',
          }}>
            {project.name}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-normal)',
          }}>
            {project.tagline}
          </div>
        </div>

        {project.highlight && (
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              color: 'var(--color-accent-primary)',
              marginBottom: 'var(--space-2)',
            }}>
              {project.highlight}
            </div>
            {project.supporting && (
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-normal)',
              }}>
                {project.supporting}
              </div>
            )}
          </div>
        )}

        {project.features && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {project.features.map(f => (
              <div key={f.label} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <span aria-hidden="true" style={{
                  width: 8, height: 8, marginTop: 6, flexShrink: 0,
                  background: 'var(--color-accent-primary)',
                }} />
                <div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'var(--weight-medium)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)',
                  }}>
                    {f.label}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    {' '}— {f.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {project.stats?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
            {project.stats.map(stat => (
              <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                }}>
                  {stat.value}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wider)',
                }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
          {project.isExternal ? (
            <a href={project.buttonUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              {actionButton}
            </a>
          ) : actionButton}
        </div>
      </div>
    </div>
  )
}

export default function DigitalHire() {
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { hireProjects } = useHirePageStats()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cinematic hero (Phase 1 overhaul) */}
      <HireHeroDigital />

      <div className="page-container" style={{ position: 'relative', zIndex: 1, background: 'var(--color-bg-base)' }}>

        {/* Project rows */}
        <section style={{ marginBottom: 'var(--space-20)', paddingTop: 'var(--space-16)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-widest)',
            marginBottom: 'var(--space-6)',
          }}>
            // THE PROOF
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {hireProjects.map(project => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </section>

        {/* Theme tiles */}
        <section style={{ marginBottom: 'var(--space-20)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-widest)',
            marginBottom: 'var(--space-6)',
          }}>
            // SEE IT IN ANY INTERFACE
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {THEME_TILES.map(tile => {
              const manifest = getTheme(tile.id)
              const comingSoon = manifest.comingSoon === true
              return (
                <button
                  key={tile.id}
                  onClick={comingSoon ? undefined : () => setTheme(tile.id)}
                  disabled={comingSoon}
                  style={{
                    textAlign: 'left',
                    padding: 'var(--space-4)',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: comingSoon ? 'not-allowed' : 'pointer',
                    opacity: comingSoon ? 0.55 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    transition: 'border-color 150ms ease',
                  }}
                  onMouseEnter={e => { if (!comingSoon) e.currentTarget.style.borderColor = 'var(--color-border-default)' }}
                  onMouseLeave={e => { if (!comingSoon) e.currentTarget.style.borderColor = 'var(--color-border-subtle)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span aria-hidden="true" style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: tile.bg, border: `2px solid ${tile.accent}`, flexShrink: 0,
                    }} />
                    {comingSoon && (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: tile.accent,
                        border: `1px solid ${tile.accent}66`,
                        borderRadius: 3,
                        padding: '1px 5px',
                      }}>
                        SOON
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                  }}>
                    {manifest.label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    lineHeight: 'var(--leading-normal)',
                  }}>
                    {manifest.description}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Bottom CTAs */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="lg" onClick={() => navigate(bottomCtas.otherStuff.url)}>
            {bottomCtas.otherStuff.label}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(bottomCtas.letsWork.url)}
            style={{ boxShadow: 'var(--shadow-lg)', fontSize: 'var(--text-base)', padding: 'var(--space-5) var(--space-10)' }}
          >
            {bottomCtas.letsWork.label} →
          </Button>
        </div>

      </div>

      <style>{`
        .dh-row {
          display: grid;
          grid-template-columns: 320px 1fr;
        }
        @media (max-width: 768px) {
          .dh-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </motion.div>
  )
}

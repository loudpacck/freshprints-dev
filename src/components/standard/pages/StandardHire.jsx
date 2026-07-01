import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useTheme } from '@/themes/useTheme'
import { getTheme } from '@/themes/registry'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'
import StandardSectionHeader from '@/components/standard/StandardSectionHeader'
import HireHeroStandard from '@/components/hire/HireHeroStandard'
import { bottomCtas } from '@/data/hirePageData'
import { useHirePageStats } from '@/hooks/useHirePageStats'

// Same accent/bg identity used by the UIPicker mini-previews, kept consistent here.
const THEME_TILES = [
  { id: 'standard', accent: '#1E3C64', bg: '#FFFFFF' },
  { id: 'digital',  accent: '#00C8FF', bg: '#0A0A0F' },
  { id: 'retro',    accent: '#000080', bg: '#C0C0C0' },
  { id: 'funky',    accent: '#BFFF00', bg: '#12041F' },
  { id: 'pantheon', accent: '#C9A961', bg: '#0A0710' },
]

function ProjectRow({ project, index }) {
  const navigate = useNavigate()

  function handleAction() {
    if (project.isExternal) {
      window.open(project.buttonUrl, '_blank', 'noopener,noreferrer')
    } else {
      navigate(project.buttonUrl)
    }
  }

  return (
    <Reveal delay={index * 0.06}>
      <div
        className="hire-row"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          aspectRatio: '16/10',
          background: 'var(--bg-elevated)',
          overflow: 'hidden',
        }}>
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
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--display-sm)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-2)',
            }}>
              {project.name}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-normal)',
            }}>
              {project.tagline}
            </div>
          </div>

          {project.highlight && (
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--weight-semibold)',
                fontSize: 'var(--text-xl)',
                color: 'var(--accent)',
                marginBottom: 'var(--space-2)',
              }}>
                {project.highlight}
              </div>
              {project.supporting && (
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
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
                    background: 'var(--accent)', borderRadius: 2,
                  }} />
                  <div>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 'var(--weight-semibold)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                    }}>
                      {f.label}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
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
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-2xl)',
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}>
                    {stat.value}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                  }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
            <StandardButton onClick={handleAction} size="md">
              {project.buttonLabel}
            </StandardButton>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export default function StandardHire() {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { hireProjects } = useHirePageStats()

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Cinematic hero (Phase 1 overhaul) — branches Standard / Retro / Funky by themeId */}
      <HireHeroStandard />

      {/* Project rows */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <StandardSectionHeader eyebrow="// THE PROOF" heading="What I've Shipped" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {hireProjects.map((project, i) => (
              <ProjectRow key={project.id} project={project} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Theme tiles */}
      <section className="s-section" style={{ background: 'var(--bg-elevated)' }}>
        <div className="s-container">
          <StandardSectionHeader eyebrow="// LIVE PREVIEW" heading="See It In Any Interface" subtitle="Click a tile to swap the UI right here, in place." />
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
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: comingSoon ? 'not-allowed' : 'pointer',
                    opacity: comingSoon ? 0.55 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    transition: 'border-color 150ms ease, transform 150ms ease',
                  }}
                  onMouseEnter={e => { if (!comingSoon) e.currentTarget.style.borderColor = 'var(--border-accent)' }}
                  onMouseLeave={e => { if (!comingSoon) e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
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
                        Soon
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 'var(--weight-semibold)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)',
                  }}>
                    {manifest.label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    lineHeight: 'var(--leading-normal)',
                  }}>
                    {manifest.description}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTAs */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <div className="hire-cta-row">
            <StandardButton variant="secondary" size="lg" onClick={() => navigate(bottomCtas.otherStuff.url)}>
              {bottomCtas.otherStuff.label}
            </StandardButton>
            <StandardButton
              size="lg"
              onClick={() => navigate(bottomCtas.letsWork.url)}
              style={{
                fontSize: 'var(--text-lg)',
                padding: 'var(--space-5) var(--space-10)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {bottomCtas.letsWork.label} →
            </StandardButton>
          </div>
        </div>
      </section>

      <style>{`
        .hire-row {
          display: grid;
          grid-template-columns: 320px 1fr;
        }
        @media (max-width: 768px) {
          .hire-row { grid-template-columns: 1fr; }
        }
        .hire-cta-row {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
        }
      `}</style>
    </motion.div>
  )
}

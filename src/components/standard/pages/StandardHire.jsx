import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardSectionHeader from '@/components/standard/StandardSectionHeader'
import HireHeroStandard from '@/components/hire/HireHeroStandard'
import HireThemeTiles from '@/components/hire/HireThemeTiles'
import HireActionButton from '@/components/hire/HireActionButton'
import { bottomCtas } from '@/data/hirePageData'
import { useHirePageStats } from '@/hooks/useHirePageStats'

function ProjectRow({ project, index }) {
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
            <HireActionButton url={project.buttonUrl} isExternal={project.isExternal} size="md">
              {project.buttonLabel}
            </HireActionButton>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export default function StandardHire() {
  const reduced = useReducedMotion()
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
          <HireThemeTiles />
        </div>
      </section>

      {/* Bottom CTAs */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <div className="hire-cta-row">
            <HireActionButton url={bottomCtas.otherStuff.url} variant="secondary" size="lg">
              {bottomCtas.otherStuff.label}
            </HireActionButton>
            <HireActionButton
              url={bottomCtas.letsWork.url}
              variant="primary"
              size="lg"
              style={{
                fontSize: 'var(--text-lg)',
                padding: 'var(--space-5) var(--space-10)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {bottomCtas.letsWork.label} →
            </HireActionButton>
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

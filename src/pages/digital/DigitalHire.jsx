import { motion } from 'framer-motion'
import { bottomCtas } from '@/data/hirePageData'
import { useHirePageStats } from '@/hooks/useHirePageStats'
import HireHeroDigital from '@/components/hire/HireHeroDigital'
import HireThemeTiles from '@/components/hire/HireThemeTiles'
import HireActionButton from '@/components/hire/HireActionButton'

function ProjectRow({ project }) {
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
          <HireActionButton url={project.buttonUrl} isExternal={project.isExternal} variant="primary">
            {project.buttonLabel}
          </HireActionButton>
        </div>
      </div>
    </div>
  )
}

export default function DigitalHire() {
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
          <HireThemeTiles />
        </section>

        {/* Bottom CTAs */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <HireActionButton url={bottomCtas.otherStuff.url} variant="secondary" size="lg">
            {bottomCtas.otherStuff.label}
          </HireActionButton>
          <HireActionButton
            url={bottomCtas.letsWork.url}
            variant="primary"
            size="lg"
            style={{ boxShadow: 'var(--shadow-lg)', fontSize: 'var(--text-base)', padding: 'var(--space-5) var(--space-10)' }}
          >
            {bottomCtas.letsWork.label} →
          </HireActionButton>
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

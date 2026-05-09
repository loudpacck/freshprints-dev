import { getFeaturedProjects } from '@/data/projects'
import ProjectCard from './ProjectCard'

export default function FeaturedStrip() {
  const featured = getFeaturedProjects().slice(0, 3)

  if (featured.length === 0) return null

  const [large, ...small] = featured

  return (
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-widest)',
          marginBottom: 'var(--space-6)',
        }}
      >
        // FEATURED
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: 'var(--space-4)',
          alignItems: 'stretch',
        }}
        className="featured-strip-grid"
      >
        {/* Large card — 60% */}
        <div style={{ minWidth: 0 }}>
          <ProjectCard project={large} size="featured" />
        </div>

        {/* Two stacked smaller cards — 40% */}
        {small.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              minWidth: 0,
            }}
          >
            {small.map((project) => (
              <ProjectCard key={project.slug} project={project} size="default" />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .featured-strip-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}

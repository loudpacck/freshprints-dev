import { getProjectBySlug } from '@/data/projects'
import ProjectCard from './ProjectCard'

export default function RelatedProjects({ slugs }) {
  if (!slugs || slugs.length === 0) return null

  const relatedProjects = slugs
    .map((slug) => getProjectBySlug(slug))
    .filter(Boolean)

  if (relatedProjects.length === 0) return null

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
        // RELATED WORK
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {relatedProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} size="compact" />
        ))}
      </div>
    </section>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import ProjectCard from './ProjectCard'

const WIDE_POSITIONS = new Set([0, 4, 7])

export default function ProjectGrid({ projects }) {
  if (projects.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-20) 0',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
        }}
      >
        // NO PROJECTS IN THIS CATEGORY
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-4)',
      }}
      className="project-grid"
    >
      <AnimatePresence mode="popLayout">
        {projects.map((project, i) => {
          const isWide = WIDE_POSITIONS.has(i)
          return (
            <motion.div
              key={project.slug}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              style={{ gridColumn: isWide ? 'span 2' : 'span 1' }}
            >
              <ProjectCard project={project} size="default" />
            </motion.div>
          )
        })}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .project-grid {
            grid-template-columns: 1fr !important;
          }
          .project-grid > div {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </div>
  )
}

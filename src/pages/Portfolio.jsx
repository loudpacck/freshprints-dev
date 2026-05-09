import { useState } from 'react'
import { motion } from 'framer-motion'
import { projects } from '@/data/projects'
import FeaturedStrip from '@/components/portfolio/FeaturedStrip'
import FilterBar from '@/components/portfolio/FilterBar'
import ProjectGrid from '@/components/portfolio/ProjectGrid'

const containerStyle = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: 'var(--space-20) var(--space-8) var(--space-24)',
}

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered =
    activeFilter === 'all'
      ? projects
      : projects.filter((p) => p.category.includes(activeFilter))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={containerStyle}>
        {/* Page header */}
        <header style={{ marginBottom: 'var(--space-16)' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-widest)',
              marginBottom: 'var(--space-4)',
            }}
          >
            // PORTFOLIO
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-5xl)',
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--leading-tight)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-4)',
            }}
          >
            SELECTED WORK
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-normal)',
              maxWidth: 560,
            }}
          >
            Software, games, engineering, AI. Real projects, real outcomes.
          </p>
        </header>

        <FeaturedStrip />

        <section>
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
            // ALL PROJECTS
          </div>

          <FilterBar active={activeFilter} onChange={setActiveFilter} />
          <ProjectGrid projects={filtered} />
        </section>
      </div>
    </motion.div>
  )
}

import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProjectBySlug } from '@/data/projects'
import Button from '@/components/ui/Button'
import ProjectHero from '@/components/portfolio/ProjectHero'
import MetricsBar from '@/components/portfolio/MetricsBar'
import VisualGallery from '@/components/portfolio/VisualGallery'
import ModelViewer from '@/components/portfolio/ModelViewer'
import RelatedProjects from '@/components/portfolio/RelatedProjects'

const OUTCOME_COPY = {
  ACTIVE:         'Currently active and shipping new features.',
  BETA:           'In active beta with live testers.',
  STABLE:         'Shipped and stable in production.',
  CONCEPT:        'Concept stage with working proof of concept.',
  PRODUCTION:     'Currently active and shipping new features.',
  PROFESSIONAL:   'Shipped and stable in production.',
  RESEARCH:       'Concept stage with working proof of concept.',
  IN_DEVELOPMENT: 'Currently in active development.',
  AVAILABLE:      'Shipped and available. Ready to use or order.',
}

const containerStyle = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '0 var(--space-8) var(--space-24)',
}

const narrowContainer = {
  maxWidth: 800,
  margin: '0 auto',
}

const sectionLabel = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-widest)',
  marginBottom: 'var(--space-6)',
}

export default function ProjectPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const project = getProjectBySlug(slug)

  if (!project || project.protected) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)',
          textAlign: 'center',
          padding: 'var(--space-8)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>
          // 404
        </span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-5xl)', color: 'var(--color-text-primary)' }}>
          PROJECT NOT FOUND
        </h1>
        <Button variant="secondary" onClick={() => navigate('/portfolio')}>
          ← Back to Portfolio
        </Button>
      </motion.div>
    )
  }

  const outcomeCopy = OUTCOME_COPY[project.status] ?? 'This project is ongoing.'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* A. Hero */}
      <ProjectHero project={project} />

      {/* B. Metrics bar */}
      <MetricsBar metrics={project.metrics} />

      <div style={containerStyle}>
        {/* C. Overview */}
        <section style={{ marginBottom: 'var(--space-16)' }}>
          <div style={narrowContainer}>
            <div style={sectionLabel}>// OVERVIEW</div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-loose)',
              }}
            >
              {project.description}
            </p>
          </div>
        </section>

        {/* D. Stack */}
        <section style={{ marginBottom: 'var(--space-16)' }}>
          <div style={narrowContainer}>
            <div style={sectionLabel}>// STACK</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wider)',
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-2) var(--space-4)',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* E. Visuals gallery */}
        <VisualGallery images={project.images} />

        {/* F. 3D Model Viewer */}
        <ModelViewer src={project.model} />

        {/* G. Outcome */}
        <section style={{ marginBottom: 'var(--space-16)' }}>
          <div style={narrowContainer}>
            <div style={sectionLabel}>// OUTCOME</div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-loose)',
              }}
            >
              {outcomeCopy}
            </p>
          </div>
        </section>

        {/* H. CTA Block */}
        <section style={{ marginBottom: 'var(--space-16)' }}>
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-12)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-3xl)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-3)',
              }}
            >
              INTERESTED IN SIMILAR WORK?
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-8)',
              }}
            >
              Let's discuss your project.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="primary">
                    VISIT {project.name.toUpperCase()} ↗
                  </Button>
                </a>
              )}
              <Button
                variant={project.liveUrl ? 'secondary' : 'primary'}
                onClick={() => navigate(project.cta.href)}
              >
                {project.cta.label}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/services')}
              >
                VIEW ALL SERVICES
              </Button>
            </div>
          </div>
        </section>

        {/* I. Related Projects */}
        <RelatedProjects slugs={project.relatedSlugs} />

        {/* J. Bottom nav */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-8)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            paddingTop: 'var(--space-8)',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <Link
            to="/portfolio"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            ← BACK TO PORTFOLIO
          </Link>
          <Link
            to="/hub"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            ⬡ RETURN TO HUB
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

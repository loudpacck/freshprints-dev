import { motion } from 'framer-motion'
import SkillMatrix from '@/components/skills/SkillMatrix'

export default function Skills() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
        paddingTop: 'var(--space-20)',
        paddingBottom: 'var(--space-20)',
      }}
    >
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '0 var(--space-6)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-12)', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-3)',
          }}>
            // SKILLS
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-6xl)',
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            lineHeight: 'var(--leading-tight)',
            marginBottom: 'var(--space-4)',
          }}>
            CAPABILITY MATRIX
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            maxWidth: 480,
            margin: '0 auto',
            lineHeight: 'var(--leading-normal)',
          }}>
            Skills connected to the work that proves them. Click a discipline to expand.
          </p>
        </div>

        {/* Skill Matrix */}
        <SkillMatrix />
      </div>
    </motion.div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { skillTiers } from '@/data/skills'
import { projects } from '@/data/projects'
import Badge from '@/components/ui/Badge'
import ProjectCard from '@/components/portfolio/ProjectCard'

function PanelContent({ tool, disciplineColor, discipline, onClose }) {
  const specs = skillTiers.specializations.filter(s => s.parentId === tool.id)
  const linkedProjects = projects.filter(p => tool.projectLinks.includes(p.slug))

  return (
    <div style={{ padding: 'var(--space-6)', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-5)',
      }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 'var(--space-4)' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            lineHeight: 1,
            marginBottom: 'var(--space-3)',
          }}>
            {tool.label}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge status={tool.proficiency} />
            {discipline && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: disciplineColor,
                border: `1px solid ${disciplineColor}44`,
                borderRadius: 'var(--radius-full)',
                padding: 'var(--space-1) var(--space-3)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
              }}>
                {discipline.label}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          style={{
            background: 'none',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-2) var(--space-3)',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Specializations */}
      {specs.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-3)',
          }}>
            // SPECIALIZATIONS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {specs.map(spec => (
              <span
                key={spec.id}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: disciplineColor ?? 'var(--color-text-secondary)',
                  background: disciplineColor ? `${disciplineColor}0F` : 'var(--color-bg-elevated)',
                  border: `1px solid ${disciplineColor ? `${disciplineColor}33` : 'var(--color-border-subtle)'}`,
                  borderRadius: 'var(--radius-full)',
                  padding: 'var(--space-1) var(--space-3)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide)',
                  whiteSpace: 'nowrap',
                }}
              >
                {spec.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related work */}
      {linkedProjects.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-3)',
          }}>
            // RELATED WORK
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {linkedProjects.map(project => (
              <ProjectCard key={project.slug} project={project} size="compact" />
            ))}
          </div>
        </div>
      )}

      {linkedProjects.length === 0 && specs.length === 0 && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          padding: 'var(--space-10) 0',
        }}>
          // No linked work yet
        </div>
      )}
    </div>
  )
}

export default function SkillDetail({
  isOpen,
  tool,
  disciplineColor,
  discipline,
  onClose,
  isMobile = false,
  reduced = false,
}) {
  return (
    <AnimatePresence>
      {isOpen && tool && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10,10,15,0.5)',
              zIndex: 'var(--z-overlay)',
            }}
          />

          {isMobile ? (
            // Bottom sheet
            <motion.div
              key="sheet"
              initial={{ y: reduced ? 0 : '100%', opacity: reduced ? 0 : 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: reduced ? 0 : '100%', opacity: reduced ? 0 : 1 }}
              transition={{ duration: reduced ? 0.15 : 0.38, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: '80vh',
                background: 'var(--color-bg-elevated)',
                borderTop: '1px solid var(--color-border-default)',
                borderRadius: '16px 16px 0 0',
                zIndex: 'calc(var(--z-overlay) + 1)',
                overflowY: 'auto',
              }}
            >
              <div style={{
                width: 40,
                height: 4,
                background: 'var(--color-border-strong)',
                borderRadius: 2,
                margin: 'var(--space-3) auto var(--space-1)',
              }} />
              <PanelContent tool={tool} disciplineColor={disciplineColor} discipline={discipline} onClose={onClose} />
            </motion.div>
          ) : (
            // Desktop side panel
            <motion.div
              key="panel"
              initial={{ x: reduced ? 0 : '100%', opacity: reduced ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: reduced ? 0 : '100%', opacity: reduced ? 0 : 1 }}
              transition={{ duration: reduced ? 0.15 : 0.38, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 360,
                background: 'var(--color-bg-elevated)',
                borderLeft: '1px solid var(--color-border-subtle)',
                zIndex: 'calc(var(--z-overlay) + 1)',
                overflowY: 'auto',
              }}
            >
              <PanelContent tool={tool} disciplineColor={disciplineColor} discipline={discipline} onClose={onClose} />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

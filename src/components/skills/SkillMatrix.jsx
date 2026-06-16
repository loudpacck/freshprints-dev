import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { skillTiers } from '@/data/skills'
import { projects } from '@/data/projects'
import useReducedMotion from '@/hooks/useReducedMotion'
import SkillNode, { STATUS_DOT } from './SkillNode'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ─── Mobile accordion view ─────────────────────────────────────────────────────

function MobileAccordion({ reduced }) {
  const [expandedDisc, setExpandedDisc] = useState(null)
  const [expandedTool, setExpandedTool] = useState(null)
  const [expandedSpec, setExpandedSpec] = useState(null)
  const [expandedProject, setExpandedProject] = useState(null)

  function handleDiscToggle(discId) {
    if (expandedDisc === discId) {
      setExpandedDisc(null); setExpandedTool(null); setExpandedSpec(null); setExpandedProject(null)
    } else {
      setExpandedDisc(discId); setExpandedTool(null); setExpandedSpec(null); setExpandedProject(null)
    }
  }

  function handleToolToggle(toolId) {
    if (expandedTool === toolId) {
      setExpandedTool(null); setExpandedSpec(null); setExpandedProject(null)
    } else {
      setExpandedTool(toolId); setExpandedSpec(null); setExpandedProject(null)
    }
  }

  function handleSpecToggle(specId, hasProjects) {
    if (!hasProjects) return
    if (expandedSpec === specId) {
      setExpandedSpec(null); setExpandedProject(null)
    } else {
      setExpandedSpec(specId); setExpandedProject(null)
    }
  }

  function handleProjectToggle(slug) {
    setExpandedProject(expandedProject === slug ? null : slug)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {skillTiers.disciplines.map(disc => {
        const isDiscExpanded = expandedDisc === disc.id
        const tools = skillTiers.tools.filter(t => t.parentId === disc.id)

        return (
          <div
            key={disc.id}
            style={{
              border: `1px solid ${isDiscExpanded ? disc.color : 'var(--color-border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              transition: 'border-color 200ms',
            }}
          >
            <button
              onClick={() => handleDiscToggle(disc.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                background: isDiscExpanded ? `${disc.color}0F` : 'var(--color-bg-surface)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 200ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: disc.color, flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  color: isDiscExpanded ? disc.color : 'var(--color-text-primary)',
                  transition: 'color 200ms',
                }}>
                  {disc.label}
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: disc.color,
                display: 'inline-block',
                transform: isDiscExpanded ? 'rotate(180deg)' : 'none',
                transition: reduced ? 'none' : 'transform 200ms',
              }}>▼</span>
            </button>

            <AnimatePresence>
              {isDiscExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    padding: 'var(--space-3) var(--space-4) var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    background: 'var(--color-bg-base)',
                  }}>
                    {tools.map(tool => {
                      const isToolExpanded = expandedTool === tool.id
                      const specs = skillTiers.specializations.filter(s => s.parentId === tool.id)

                      return (
                        <div key={tool.id}>
                          <button
                            onClick={() => handleToolToggle(tool.id)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: 'var(--space-3) var(--space-4)',
                              background: isToolExpanded ? `${disc.color}10` : 'var(--color-bg-surface)',
                              border: `1px solid ${isToolExpanded ? disc.color : 'var(--color-border-subtle)'}`,
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background 150ms, border-color 150ms',
                            }}
                          >
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 'var(--text-sm)',
                              color: isToolExpanded ? disc.color : 'var(--color-text-secondary)',
                              textTransform: 'uppercase',
                              letterSpacing: 'var(--tracking-wide)',
                              transition: 'color 150ms',
                            }}>
                              {tool.label}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                              <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                              }}>
                                {tool.proficiency}
                              </span>
                              <span style={{
                                color: disc.color,
                                fontSize: 'var(--text-xs)',
                                display: 'inline-block',
                                transform: isToolExpanded ? 'rotate(90deg)' : 'none',
                                transition: reduced ? 'none' : 'transform 200ms',
                              }}>→</span>
                            </div>
                          </button>

                          <AnimatePresence>
                            {isToolExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: reduced ? 0 : 0.2 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{
                                  paddingLeft: 'var(--space-4)',
                                  paddingTop: 'var(--space-2)',
                                  paddingBottom: 'var(--space-1)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 'var(--space-2)',
                                }}>
                                  {specs.length === 0 ? (
                                    <span style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: 'var(--text-xs)',
                                      color: 'var(--color-text-muted)',
                                      paddingLeft: 'var(--space-2)',
                                    }}>// No specializations</span>
                                  ) : specs.map(spec => {
                                    const isSpecExpanded = expandedSpec === spec.id
                                    const specProjects = projects.filter(p => spec.projectLinks.includes(p.slug))

                                    return (
                                      <div key={spec.id}>
                                        <button
                                          onClick={() => handleSpecToggle(spec.id, specProjects.length > 0)}
                                          style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: 'var(--space-2) var(--space-3)',
                                            background: isSpecExpanded ? `${disc.color}18` : `${disc.color}0A`,
                                            border: `1px solid ${isSpecExpanded ? disc.color : `${disc.color}33`}`,
                                            borderRadius: 'var(--radius-full)',
                                            cursor: specProjects.length > 0 ? 'pointer' : 'default',
                                            textAlign: 'left',
                                            transition: 'background 150ms, border-color 150ms',
                                          }}
                                        >
                                          <span style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 'var(--text-xs)',
                                            color: isSpecExpanded ? disc.color : 'var(--color-text-muted)',
                                            textTransform: 'uppercase',
                                            letterSpacing: 'var(--tracking-wide)',
                                            transition: 'color 150ms',
                                          }}>
                                            {spec.label}
                                          </span>
                                          {specProjects.length > 0 && (
                                            <span style={{ color: disc.color, fontSize: 'var(--text-xs)', marginLeft: 'var(--space-2)' }}>
                                              {isSpecExpanded ? '▲' : '▼'}
                                            </span>
                                          )}
                                        </button>

                                        <AnimatePresence>
                                          {isSpecExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: reduced ? 0 : 0.18 }}
                                              style={{ overflow: 'hidden' }}
                                            >
                                              <div style={{
                                                paddingLeft: 'var(--space-4)',
                                                paddingTop: 'var(--space-2)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 'var(--space-2)',
                                              }}>
                                                {specProjects.length === 0 ? (
                                                  <span style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: 'var(--text-xs)',
                                                    color: 'var(--color-text-muted)',
                                                    paddingLeft: 'var(--space-2)',
                                                  }}>// No public case study yet</span>
                                                ) : specProjects.map(project => {
                                                  const isProjectExpanded = expandedProject === project.slug
                                                  const usageText = spec.projectUsage?.[project.slug]

                                                  return (
                                                    <div key={project.slug}>
                                                      <button
                                                        onClick={() => handleProjectToggle(project.slug)}
                                                        style={{
                                                          width: '100%',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: 'var(--space-2)',
                                                          padding: 'var(--space-2) var(--space-3)',
                                                          background: isProjectExpanded ? `${disc.color}15` : 'var(--color-bg-surface)',
                                                          border: `1px solid ${isProjectExpanded ? disc.color : 'var(--color-border-subtle)'}`,
                                                          borderRadius: 'var(--radius-sm)',
                                                          cursor: 'pointer',
                                                          textAlign: 'left',
                                                          transition: 'background 150ms, border-color 150ms',
                                                        }}
                                                      >
                                                        <span style={{
                                                          width: 6,
                                                          height: 6,
                                                          borderRadius: '50%',
                                                          background: STATUS_DOT[project.status] ?? '#9090A8',
                                                          flexShrink: 0,
                                                        }} />
                                                        <span style={{
                                                          fontFamily: 'var(--font-mono)',
                                                          fontSize: 'var(--text-xs)',
                                                          color: isProjectExpanded ? disc.color : 'var(--color-text-secondary)',
                                                          textTransform: 'uppercase',
                                                          letterSpacing: 'var(--tracking-wide)',
                                                          flex: 1,
                                                          transition: 'color 150ms',
                                                        }}>
                                                          {project.name}
                                                        </span>
                                                        <span style={{ color: disc.color, fontSize: 'var(--text-xs)' }}>
                                                          {isProjectExpanded ? '▲' : '▼'}
                                                        </span>
                                                      </button>

                                                      <AnimatePresence>
                                                        {isProjectExpanded && usageText && (
                                                          <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: reduced ? 0 : 0.18 }}
                                                            style={{ overflow: 'hidden' }}
                                                          >
                                                            <div style={{
                                                              padding: 'var(--space-3) var(--space-4)',
                                                              marginTop: 'var(--space-1)',
                                                              background: 'var(--color-bg-surface)',
                                                              border: `1px solid ${disc.color}33`,
                                                              borderRadius: 'var(--radius-sm)',
                                                            }}>
                                                              <p style={{
                                                                fontFamily: 'var(--font-body)',
                                                                fontSize: 'var(--text-sm)',
                                                                color: 'var(--color-text-secondary)',
                                                                lineHeight: 'var(--leading-relaxed)',
                                                                margin: '0 0 var(--space-3) 0',
                                                              }}>
                                                                {usageText}
                                                              </p>
                                                              <Link
                                                                to={`/portfolio/${project.slug}`}
                                                                style={{
                                                                  fontFamily: 'var(--font-mono)',
                                                                  fontSize: 'var(--text-xs)',
                                                                  color: disc.color,
                                                                  textDecoration: 'none',
                                                                  letterSpacing: 'var(--tracking-wide)',
                                                                }}
                                                              >
                                                                View project ↗
                                                              </Link>
                                                            </div>
                                                          </motion.div>
                                                        )}
                                                      </AnimatePresence>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ─── Desktop graph view ────────────────────────────────────────────────────────

function btmCenter(el, box) {
  const r = el.getBoundingClientRect()
  return { x: r.left - box.left + r.width / 2, y: r.bottom - box.top }
}

function topCenter(el, box) {
  const r = el.getBoundingClientRect()
  return { x: r.left - box.left + r.width / 2, y: r.top - box.top }
}

export default function SkillMatrix() {
  const reduced = useReducedMotion()
  const isMobile = useIsMobile()

  const [selectedDisc, setSelectedDisc] = useState(null)
  const [selectedTool, setSelectedTool] = useState(null)
  const [selectedSpec, setSelectedSpec] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)

  const containerRef = useRef(null)
  const discRefs = useRef({})
  const toolRefs = useRef({})
  const specRefs = useRef({})
  const projectRefs = useRef({})
  const usageRef = useRef(null)
  const [lines, setLines] = useState([])

  const measureLines = useCallback(() => {
    if (!containerRef.current || !selectedDisc) { setLines([]); return }
    const box = containerRef.current.getBoundingClientRect()
    const disc = skillTiers.disciplines.find(d => d.id === selectedDisc)
    const discEl = discRefs.current[selectedDisc]
    if (!disc || !discEl) { setLines([]); return }

    const newLines = []
    const from1 = btmCenter(discEl, box)

    // disc → tools
    skillTiers.tools.filter(t => t.parentId === selectedDisc).forEach(tool => {
      const el = toolRefs.current[tool.id]
      if (!el) return
      const to = topCenter(el, box)
      newLines.push({ id: `disc-${tool.id}`, x1: from1.x, y1: from1.y, x2: to.x, y2: to.y, color: disc.color })
    })

    // tool → specs
    if (selectedTool) {
      const toolEl = toolRefs.current[selectedTool]
      if (toolEl) {
        const from2 = btmCenter(toolEl, box)
        skillTiers.specializations.filter(s => s.parentId === selectedTool).forEach(spec => {
          const el = specRefs.current[spec.id]
          if (!el) return
          const to = topCenter(el, box)
          newLines.push({ id: `tool-${spec.id}`, x1: from2.x, y1: from2.y, x2: to.x, y2: to.y, color: disc.color })
        })

        // spec → projects
        if (selectedSpec) {
          const specEl = specRefs.current[selectedSpec]
          const specData = skillTiers.specializations.find(s => s.id === selectedSpec)
          if (specEl && specData) {
            const from3 = btmCenter(specEl, box)
            specData.projectLinks.forEach(slug => {
              const el = projectRefs.current[slug]
              if (!el) return
              const to = topCenter(el, box)
              newLines.push({ id: `spec-${slug}`, x1: from3.x, y1: from3.y, x2: to.x, y2: to.y, color: disc.color })
            })

            // project → usage
            if (selectedProject) {
              const projEl = projectRefs.current[selectedProject]
              const usageEl = usageRef.current
              if (projEl && usageEl) {
                const from4 = btmCenter(projEl, box)
                const to = topCenter(usageEl, box)
                newLines.push({ id: 'proj-usage', x1: from4.x, y1: from4.y, x2: to.x, y2: to.y, color: disc.color })
              }
            }
          }
        }
      }
    }

    setLines(newLines)
  }, [selectedDisc, selectedTool, selectedSpec, selectedProject])

  // Clear all lines only when discipline changes (full reset)
  useEffect(() => {
    setLines([])
  }, [selectedDisc])

  // Re-measure on any selection change (no clear — stable keys survive)
  useEffect(() => {
    if (!selectedDisc) return
    const t = setTimeout(measureLines, 320)
    return () => clearTimeout(t)
  }, [selectedDisc, selectedTool, selectedSpec, selectedProject, measureLines])

  // Resize handler
  useEffect(() => {
    if (!selectedDisc) return
    const fn = () => setTimeout(measureLines, 60)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [selectedDisc, measureLines])

  function handleDiscClick(discId) {
    if (selectedDisc === discId) {
      setSelectedDisc(null); setSelectedTool(null); setSelectedSpec(null); setSelectedProject(null)
    } else {
      setSelectedDisc(discId); setSelectedTool(null); setSelectedSpec(null); setSelectedProject(null)
    }
  }

  function handleToolClick(toolId) {
    if (selectedTool === toolId) {
      setSelectedTool(null); setSelectedSpec(null); setSelectedProject(null)
    } else {
      setSelectedTool(toolId); setSelectedSpec(null); setSelectedProject(null)
    }
  }

  function handleSpecClick(specId) {
    if (selectedSpec === specId) {
      setSelectedSpec(null); setSelectedProject(null)
    } else {
      setSelectedSpec(specId); setSelectedProject(null)
    }
  }

  function handleProjectClick(slug) {
    setSelectedProject(selectedProject === slug ? null : slug)
  }

  const discipline = selectedDisc ? skillTiers.disciplines.find(d => d.id === selectedDisc) : null
  const currentTools = selectedDisc ? skillTiers.tools.filter(t => t.parentId === selectedDisc) : []
  const selectedToolData = selectedTool ? skillTiers.tools.find(t => t.id === selectedTool) : null

  // Mobile view
  if (isMobile) {
    return <MobileAccordion reduced={reduced} />
  }

  // Desktop view
  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', paddingBottom: 'var(--space-8)' }}
    >
      {/* SVG connector overlay */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <AnimatePresence>
          {lines.map(line => (
            <motion.path
              key={line.id}
              d={`M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`}
              stroke={line.color}
              strokeWidth={1.5}
              strokeOpacity={0.45}
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.4, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </svg>

      {/* Discipline row */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1,
      }}>
        {skillTiers.disciplines.map(disc => (
          <SkillNode
            key={disc.id}
            type="discipline"
            data={disc}
            isSelected={selectedDisc === disc.id}
            isDimmed={selectedDisc !== null && selectedDisc !== disc.id}
            onClick={() => handleDiscClick(disc.id)}
            nodeRef={el => {
              if (el) discRefs.current[disc.id] = el
              else delete discRefs.current[disc.id]
            }}
            reduced={reduced}
          />
        ))}
      </div>

      {/* Tool row */}
      <AnimatePresence mode="wait">
        {selectedDisc && currentTools.length > 0 && (
          <motion.div
            key={selectedDisc}
            initial={{ opacity: 0, y: reduced ? 0 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -6 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-10)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {currentTools.map(tool => (
              <SkillNode
                key={tool.id}
                type="tool"
                data={tool}
                disciplineColor={discipline?.color}
                isSelected={selectedTool === tool.id}
                onClick={() => handleToolClick(tool.id)}
                nodeRef={el => {
                  if (el) toolRefs.current[tool.id] = el
                  else delete toolRefs.current[tool.id]
                }}
                reduced={reduced}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Specialization row */}
      <AnimatePresence>
        {selectedToolData && (() => {
          const specs = skillTiers.specializations.filter(s => s.parentId === selectedToolData.id)
          return specs.length > 0 ? (
            <motion.div
              key={`specs-${selectedTool}`}
              initial={{ opacity: 0, y: reduced ? 0 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.22 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-6)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {specs.map(spec => (
                <SkillNode
                  key={spec.id}
                  type="specialization"
                  data={spec}
                  disciplineColor={discipline?.color}
                  isSelected={selectedSpec === spec.id}
                  onClick={() => handleSpecClick(spec.id)}
                  nodeRef={el => {
                    if (el) specRefs.current[spec.id] = el
                    else delete specRefs.current[spec.id]
                  }}
                  reduced={reduced}
                />
              ))}
            </motion.div>
          ) : null
        })()}
      </AnimatePresence>

      {/* Project row */}
      <AnimatePresence>
        {selectedSpec && (() => {
          const specData = skillTiers.specializations.find(s => s.id === selectedSpec)
          const linkedProjects = projects.filter(p => specData?.projectLinks.includes(p.slug))
          return (
            <motion.div
              key={`proj-${selectedSpec}`}
              initial={{ opacity: 0, y: reduced ? 0 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.22 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-6)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {linkedProjects.length === 0 ? (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wider)',
                }}>
                  // No public case study yet
                </span>
              ) : linkedProjects.map(project => (
                <SkillNode
                  key={project.slug}
                  type="project"
                  data={project}
                  disciplineColor={discipline?.color}
                  isSelected={selectedProject === project.slug}
                  onClick={() => handleProjectClick(project.slug)}
                  nodeRef={el => {
                    if (el) projectRefs.current[project.slug] = el
                    else delete projectRefs.current[project.slug]
                  }}
                  reduced={reduced}
                />
              ))}
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Usage leaf */}
      <AnimatePresence>
        {selectedProject && selectedSpec && (() => {
          const specData = skillTiers.specializations.find(s => s.id === selectedSpec)
          const usageText = specData?.projectUsage?.[selectedProject]
          const projectData = projects.find(p => p.slug === selectedProject)
          if (!usageText || !projectData) return null
          return (
            <motion.div
              key={`usage-${selectedProject}`}
              initial={{ opacity: 0, y: reduced ? 0 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.22 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 'var(--space-6)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <SkillNode
                type="usage"
                data={{
                  projectName: projectData.name,
                  projectSlug: selectedProject,
                  usageText,
                }}
                disciplineColor={discipline?.color}
                nodeRef={el => { usageRef.current = el }}
                reduced={reduced}
              />
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Hint text */}
      <AnimatePresence>
        {!selectedDisc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              textAlign: 'center',
              marginTop: 'var(--space-8)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            // SELECT A DISCIPLINE TO EXPLORE
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

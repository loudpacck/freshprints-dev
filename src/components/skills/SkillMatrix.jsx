import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { skillTiers } from '@/data/skills'
import useReducedMotion from '@/hooks/useReducedMotion'
import SkillNode from './SkillNode'
import SkillDetail from './SkillDetail'

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

function MobileAccordion({ onToolClick, reduced }) {
  const [expandedDisc, setExpandedDisc] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {skillTiers.disciplines.map(disc => {
        const isExpanded = expandedDisc === disc.id
        const tools = skillTiers.tools.filter(t => t.parentId === disc.id)

        return (
          <div
            key={disc.id}
            style={{
              border: `1px solid ${isExpanded ? disc.color : 'var(--color-border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              transition: 'border-color 200ms',
            }}
          >
            <button
              onClick={() => setExpandedDisc(isExpanded ? null : disc.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                background: isExpanded ? `${disc.color}0F` : 'var(--color-bg-surface)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 200ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: disc.color,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  color: isExpanded ? disc.color : 'var(--color-text-primary)',
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
                transform: isExpanded ? 'rotate(180deg)' : 'none',
                transition: reduced ? 'none' : 'transform 200ms',
              }}>▼</span>
            </button>

            <AnimatePresence>
              {isExpanded && (
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
                    {tools.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => onToolClick(tool)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--color-bg-surface)',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: 'var(--tracking-wide)',
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
                          <span style={{ color: disc.color, fontSize: 'var(--text-xs)' }}>→</span>
                        </div>
                      </button>
                    ))}
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

export default function SkillMatrix() {
  const reduced = useReducedMotion()
  const isMobile = useIsMobile()

  const [selectedDisc, setSelectedDisc] = useState(null)
  const [selectedTool, setSelectedTool] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const containerRef = useRef(null)
  const discRefs = useRef({})
  const toolRefs = useRef({})
  const [lines, setLines] = useState([])

  const measureLines = useCallback(() => {
    if (!containerRef.current || !selectedDisc) {
      setLines([])
      return
    }
    const box = containerRef.current.getBoundingClientRect()
    const disc = skillTiers.disciplines.find(d => d.id === selectedDisc)
    const discEl = discRefs.current[selectedDisc]
    if (!disc || !discEl) { setLines([]); return }

    const dr = discEl.getBoundingClientRect()
    const x1 = dr.left - box.left + dr.width / 2
    const y1 = dr.bottom - box.top

    const newLines = []
    skillTiers.tools
      .filter(t => t.parentId === selectedDisc)
      .forEach(tool => {
        const el = toolRefs.current[tool.id]
        if (!el) return
        const tr = el.getBoundingClientRect()
        newLines.push({
          id: tool.id,
          x1,
          y1,
          x2: tr.left - box.left + tr.width / 2,
          y2: tr.top - box.top,
          color: disc.color,
        })
      })
    setLines(newLines)
  }, [selectedDisc])

  useEffect(() => {
    setLines([])
    if (!selectedDisc) return
    const timer = setTimeout(measureLines, 320)
    return () => clearTimeout(timer)
  }, [selectedDisc, measureLines])

  useEffect(() => {
    if (!selectedDisc) return
    const fn = () => setTimeout(measureLines, 60)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [selectedDisc, measureLines])

  function handleDiscClick(discId) {
    if (selectedDisc === discId) {
      setSelectedDisc(null)
      setSelectedTool(null)
      setDetailOpen(false)
    } else {
      setSelectedDisc(discId)
      setSelectedTool(null)
      setDetailOpen(false)
    }
  }

  function handleToolClick(toolData) {
    const toolId = typeof toolData === 'string' ? toolData : toolData.id
    setSelectedTool(toolId)
    setDetailOpen(true)
  }

  function closeDetail() {
    setDetailOpen(false)
    setSelectedTool(null)
  }

  const discipline = selectedDisc ? skillTiers.disciplines.find(d => d.id === selectedDisc) : null
  const currentTools = selectedDisc ? skillTiers.tools.filter(t => t.parentId === selectedDisc) : []
  const selectedToolData = selectedTool ? skillTiers.tools.find(t => t.id === selectedTool) : null

  // Mobile view
  if (isMobile) {
    return (
      <>
        <MobileAccordion
          onToolClick={(tool) => handleToolClick(tool)}
          reduced={reduced}
        />
        <SkillDetail
          isOpen={detailOpen && !!selectedToolData}
          tool={selectedToolData}
          disciplineColor={discipline?.color}
          discipline={discipline}
          onClose={closeDetail}
          isMobile
          reduced={reduced}
        />
      </>
    )
  }

  // Desktop view
  return (
    <div style={{ position: 'relative' }}>
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
                key={selectedTool}
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
                    reduced={reduced}
                  />
                ))}
              </motion.div>
            ) : null
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

      {/* Side detail panel */}
      <SkillDetail
        isOpen={detailOpen && !!selectedToolData}
        tool={selectedToolData}
        disciplineColor={discipline?.color}
        discipline={discipline}
        onClose={closeDetail}
        isMobile={false}
        reduced={reduced}
      />
    </div>
  )
}

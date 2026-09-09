import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useReducedMotion from '@/hooks/useReducedMotion'
import useDeferredMount from '@/hooks/useDeferredMount'
import { siteStatus } from '@/data/siteStatus'
import { useSound } from '@/sound/useSound'
import HubSystemControls from '@/components/hub/HubSystemControls'

// ─── Node data ────────────────────────────────────────────────────────────────

const NODES = [
  { id: 0, label: 'PORTFOLIO', route: '/portfolio', descriptor: 'Engineering work',    icon: 'terminal'  },
  { id: 1, label: 'BEAT BEATERS', route: '/lab/beat-beaters', descriptor: '9-lane rhythm game', icon: 'note' },
  { id: 2, label: 'PANTHEON',  route: '/games/pantheon-wars', descriptor: 'Live browser MMO', icon: 'controller' },
  { id: 3, label: 'LAB',       route: '/lab',       descriptor: 'Experiments & demos', icon: 'beaker'    },
  { id: 4, label: 'HIRE',      route: '/hire',      descriptor: 'Start a project',     icon: 'hire'      },
  { id: 5, label: 'MEDIA',     route: '/media',     descriptor: 'Content & devlogs',   icon: 'play'      },
  { id: 6, label: 'ABOUT',     route: '/about',     descriptor: 'Who I am',            icon: 'profile'   },
  { id: 7, label: 'CONTACT',   route: '/contact',   descriptor: 'Get in touch',        icon: 'mail'      },
]

// Layout rows: 3-2-3 honeycomb (center row auto-offsets via flexbox centering)
const ROWS = [NODES.slice(0, 3), NODES.slice(3, 5), NODES.slice(5, 8)]

// Arrow-key adjacency map: nodeId → key → nextNodeId (null = boundary)
const ADJACENCY = {
  0: { ArrowUp: null, ArrowDown: 3,    ArrowLeft: null, ArrowRight: 1    },
  1: { ArrowUp: null, ArrowDown: 3,    ArrowLeft: 0,    ArrowRight: 2    },
  2: { ArrowUp: null, ArrowDown: 4,    ArrowLeft: 1,    ArrowRight: null },
  3: { ArrowUp: 0,    ArrowDown: 6,    ArrowLeft: null, ArrowRight: 4    },
  4: { ArrowUp: 2,    ArrowDown: 6,    ArrowLeft: 3,    ArrowRight: null },
  5: { ArrowUp: 3,    ArrowDown: null, ArrowLeft: null, ArrowRight: 6    },
  6: { ArrowUp: 4,    ArrowDown: null, ArrowLeft: 5,    ArrowRight: 7    },
  7: { ArrowUp: 4,    ArrowDown: null, ArrowLeft: 6,    ArrowRight: null },
}

// Entry animation delay per node (center-outward: 3,4 first → 1,6 → 0,2,5,7)
const ENTRY_DELAY = { 0: 0.10, 1: 0.05, 2: 0.10, 3: 0, 4: 0, 5: 0.10, 6: 0.05, 7: 0.10 }

const HEX_W = 140
const HEX_H = 120

// ─── Hex point string (flat-top hexagon) ─────────────────────────────────────

const HEX_POINTS = [
  [HEX_W * 0.25, 0],
  [HEX_W * 0.75, 0],
  [HEX_W,        HEX_H * 0.5],
  [HEX_W * 0.75, HEX_H],
  [HEX_W * 0.25, HEX_H],
  [0,            HEX_H * 0.5],
].map((p) => p.join(',')).join(' ')

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({ type }) {
  const p = { stroke: 'currentColor', strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const s = { width: 18, height: 18 }

  switch (type) {
    case 'terminal':  return <svg viewBox="0 0 20 20" style={s}><polyline points="3,5 9,10 3,15" {...p}/><line x1="11" y1="15" x2="17" y2="15" {...p}/></svg>
    case 'note':      return <svg viewBox="0 0 20 20" style={s}><circle cx="6" cy="15" r="2.5" {...p}/><circle cx="15" cy="13" r="2.5" {...p}/><line x1="8.5" y1="15" x2="8.5" y2="4" {...p}/><line x1="17.5" y1="13" x2="17.5" y2="2.5" {...p}/><path d="M8.5 4l9-1.5" {...p}/></svg>
    case 'gear':      return <svg viewBox="0 0 20 20" style={s}><circle cx="10" cy="10" r="2.5" {...p}/><path d="M10 3.5v2M10 14.5v2M3.5 10h2M14.5 10h2M5.6 5.6l1.5 1.5M13 13l1.5 1.5M5.6 14.4l1.5-1.5M13 7l1.5-1.5" {...p}/></svg>
    case 'controller': return <svg viewBox="0 0 20 20" style={s}><rect x="1.5" y="6" width="17" height="10" rx="3.5" {...p}/><line x1="6" y1="9" x2="6" y2="13" {...p}/><line x1="4" y1="11" x2="8" y2="11" {...p}/><circle cx="14" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="12.5" r="1" fill="currentColor" stroke="none"/></svg>
    case 'beaker':    return <svg viewBox="0 0 20 20" style={s}><path d="M7.5 2v6L3 15.5a1 1 0 00.9 1.5h12.2a1 1 0 00.9-1.5L12.5 8V2" {...p}/><line x1="6" y1="2" x2="14" y2="2" {...p}/><circle cx="8.5" cy="14" r="0.8" fill="currentColor" stroke="none"/></svg>
    case 'hire':      return <svg viewBox="0 0 20 20" style={s}><circle cx="7.5" cy="6.5" r="3.5" {...p}/><path d="M1.5 18c0-3.3 2.7-6 6-6" {...p}/><line x1="15" y1="10.5" x2="15" y2="17" {...p}/><line x1="11.75" y1="13.75" x2="18.25" y2="13.75" {...p}/></svg>
    case 'play':      return <svg viewBox="0 0 20 20" style={s}><polygon points="4,2 18,10 4,18" {...p}/></svg>
    case 'profile':   return <svg viewBox="0 0 20 20" style={s}><circle cx="10" cy="6.5" r="3.5" {...p}/><path d="M2.5 19c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5" {...p}/></svg>
    case 'mail':      return <svg viewBox="0 0 20 20" style={s}><rect x="1.5" y="4" width="17" height="13" rx="1.5" {...p}/><polyline points="1.5,4 10,12 18.5,4" {...p}/></svg>
    default:          return null
  }
}

// ─── Code-rain background (lazy — canvas only, no library) ──
// Hub-only by design. Do not import HubRain from any other page.

const HubRain = lazy(() => import('@/components/hub/HubRain'))

// ─── Single hex node ──────────────────────────────────────────────────────────

function HexNode({ node, isHovered, isFocused, isExiting, onHover, onClick, nodeRef, entryDelay, reduced }) {
  const { play } = useSound()
  const active = isHovered || isFocused

  return (
    <motion.div
      ref={nodeRef}
      initial={reduced ? undefined : { opacity: 0, scale: 1.06 }}
      animate={
        isExiting
          ? { scale: 1.5, opacity: 0 }
          : { opacity: 1, scale: 1 }
      }
      transition={
        isExiting
          ? { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
          : { duration: 0.45, delay: reduced ? 0 : entryDelay, ease: [0.16, 1, 0.3, 1] }
      }
      style={{
        position: 'relative',
        width: HEX_W,
        height: HEX_H,
        cursor: 'crosshair',
        outline: 'none',
        flexShrink: 0,
      }}
      tabIndex={0}
      role="button"
      aria-label={`Navigate to ${node.label}`}
      onMouseEnter={() => { onHover(node.id); play('activate') }}
      onMouseLeave={() => onHover(null)}
      onFocus={() => { onHover(node.id); play('activate') }}
      onBlur={() => onHover(null)}
      onClick={() => { play('select'); onClick(node) }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(node)
        }
      }}
    >
      {/* Hex outline via SVG — drawn, not lit. Phase 9: no drop-shadow glow.
          Idle: 1px border token, transparent fill.
          Hover/focus: border flips to accent, fill stays transparent.
          Pressed (exiting): inverted — accent fill, bg-base glyphs. */}
      <svg
        width={HEX_W}
        height={HEX_H}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <polygon
          points={HEX_POINTS}
          fill={isExiting ? 'var(--color-accent-primary)' : 'transparent'}
          stroke={active || isExiting ? 'var(--color-accent-primary)' : 'var(--color-border-default)'}
          strokeWidth={1}
          style={{
            transition: reduced ? undefined : 'stroke 200ms, fill 200ms',
          }}
        />
      </svg>

      {/* Node content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        color: isExiting
          ? 'var(--color-text-inverse)'
          : active
            ? 'var(--color-text-accent)'
            : 'var(--color-text-primary)',
        transition: 'color 200ms',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <Icon type={node.icon} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)',
        }}>
          {node.label}
        </span>
      </div>

      {/* Descriptor tooltip */}
      <AnimatePresence>
        {active && !isExiting && (
          <motion.span
            initial={{ opacity: 0, y: -4, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, x: '-50%' }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              marginTop: 'var(--space-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {node.descriptor}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Responsive radial dims ───────────────────────────────────────────────────

const NODE_H = 34 // approximate node button height in px

function getRadialDims() {
  const w = window.innerWidth
  const nodeW = w < 380 ? 64 : w < 480 ? 72 : 88
  const safetyMargin = 16
  const maxRadius = (w / 2) - (nodeW / 2) - safetyMargin
  const idealRadius = w < 480 ? w * 0.28 : w * 0.30
  const radius = Math.min(idealRadius, maxRadius, 130)
  return { radius, nodeW }
}

// ─── Mobile radial drawer ─────────────────────────────────────────────────────

function MobileRadial({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [dims, setDims] = useState(getRadialDims)

  useEffect(() => {
    const handler = () => setDims(getRadialDims())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const { radius, nodeW } = dims

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    }}>
      {/* Tap-outside backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
          />
        )}
      </AnimatePresence>

      {/* 0×0 anchor at viewport center — all nodes and the button center here */}
      <div style={{ position: 'relative', width: 0, height: 0, zIndex: 1 }}>
        {/* Radial nodes — left/top center them at origin; x/y translate to final radial position */}
        {NODES.map((node, i) => {
          const angle = ((i * 360) / 8 - 90) * (Math.PI / 180)
          const tx = Math.cos(angle) * radius
          const ty = Math.sin(angle) * radius

          return (
            <motion.button
              key={node.id}
              initial={false}
              animate={
                open
                  ? { x: tx, y: ty, opacity: 1, scale: 1, transition: { delay: i * 0.05, duration: 0.32, ease: [0.16, 1, 0.3, 1] } }
                  : { x: 0, y: 0, opacity: 0, scale: 0.4, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } }
              }
              onClick={() => { setOpen(false); onNavigate(node) }}
              style={{
                position: 'absolute',
                width: nodeW,
                left: -(nodeW / 2),
                top: -(NODE_H / 2),
                background: 'transparent',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-1)',
                cursor: 'crosshair',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 'var(--weight-medium)',
                textTransform: 'uppercase',
                letterSpacing: 0,
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                pointerEvents: open ? 'auto' : 'none',
              }}
            >
              {node.label}
            </motion.button>
          )
        })}

        {/* Center toggle button — plain div centers it at the 0×0 origin = viewport center */}
        <div style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
          <motion.button
            animate={{ background: open ? 'var(--color-accent-primary)' : 'transparent' }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen((v) => !v)}
            style={{
              display: 'block',
              border: '1px solid var(--color-accent-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3) var(--space-6)',
              cursor: 'crosshair',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              color: open ? 'var(--color-text-inverse)' : 'var(--color-text-accent)',
              transition: 'color 200ms',
              whiteSpace: 'nowrap',
            }}
          >
            {open ? 'CLOSE' : 'OPEN TERMINAL'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ─── Hub page ─────────────────────────────────────────────────────────────────

export default function Hub() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const bgReady = useDeferredMount()

  const [hoveredId, setHoveredId] = useState(null)
  const [focusedId, setFocusedId] = useState(null)
  const [exitingId, setExitingId] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  const focusedRef = useRef(null)
  const nodeRefs = useRef({})

  // Keep ref in sync with state (for use inside non-reactive keydown handler)
  useEffect(() => { focusedRef.current = focusedId }, [focusedId])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleNodeClick = useCallback((node) => {
    if (exitingId !== null) return
    if (reduced) { navigate(node.route); return }
    setExitingId(node.id)
    setTimeout(() => navigate(node.route), 420)
  }, [exitingId, navigate, reduced])

  // Global arrow-key + Enter navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (ARROWS.includes(e.key)) {
        e.preventDefault()
        setFocusedId((prev) => {
          const current = prev ?? 1
          const next = ADJACENCY[current]?.[e.key]
          if (next !== null && next !== undefined) {
            setTimeout(() => nodeRefs.current[next]?.focus(), 0)
            return next
          }
          return current
        })
      }

      if ((e.key === 'Enter' || e.key === ' ') && focusedRef.current !== null) {
        const node = NODES[focusedRef.current]
        if (node) handleNodeClick(node)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNodeClick])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'var(--color-bg-base)' }}
    >
      {/* ── Code rain — deferred past first paint. HubRain self-skips under
             reduced motion and below 768px; see the component. ── */}
      {!reduced && !isMobile && bgReady && (
        <Suspense fallback={null}>
          <HubRain />
        </Suspense>
      )}

      {/* Phase 9: the SVG inner-glow filter and the sweeping cyan scan-bar are
          gone. The CRT signal is the repeating scanline overlay defined once in
          digital/tokens.css, applied to the whole viewport. */}

      {/* ── UI overlay ── */}
      {(() => {
        const parts = siteStatus.lastUpdated.split('-')
        const lastUpdatedShort = parts.slice(1).join('.')
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
            {/* Top-left */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="hub-corner"
              style={{
                position: 'absolute',
                top: 'calc(var(--space-6) + env(safe-area-inset-top, 0px))',
                left: 'calc(var(--space-6) + env(safe-area-inset-left, 0px))',
              }}
            >
              {isMobile ? 'OPERATIONS TERMINAL' : 'FRESH PRINTS // OPERATIONS TERMINAL'}
            </motion.div>

            {/* Top-right */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{
                position: 'absolute',
                top: 'calc(var(--space-6) + env(safe-area-inset-top, 0px))',
                right: 'calc(var(--space-6) + env(safe-area-inset-right, 0px))',
                pointerEvents: 'auto',
              }}
            >
              {/* Phase 9: the ONLINE readout is plain mono text plus one
                  blinking block cursor — the single animated element in the
                  hub chrome. .dg-cursor stops under reduced motion. */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                color: 'var(--color-text-secondary)',
              }}>
                ONLINE
                <span className="dg-cursor" aria-hidden="true">█</span>
              </span>
            </motion.div>

            {/* Bottom-left — hidden below 480px via CSS */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="hub-corner hub-corner-bl"
              style={{
                position: 'absolute',
                bottom: 'calc(var(--space-6) + env(safe-area-inset-bottom, 0px))',
                left: 'calc(var(--space-6) + env(safe-area-inset-left, 0px))',
              }}
            >
              {siteStatus.availabilityNote}
            </motion.div>

            {/* Bottom-right — hidden below 480px via CSS */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="hub-corner hub-corner-br"
              style={{
                position: 'absolute',
                bottom: 'calc(var(--space-6) + env(safe-area-inset-bottom, 0px))',
                right: 'calc(var(--space-6) + env(safe-area-inset-right, 0px))',
              }}
            >
              {isMobile ? `SYNC: ${lastUpdatedShort}` : `LAST SYNC: ${siteStatus.lastUpdated}`}
            </motion.div>
          </div>
        )
      })()}

      {/* ── System controls cluster ── */}
      <HubSystemControls reduced={reduced} />

      {/* ── Honeycomb / Mobile radial ── */}
      {isMobile ? (
        <MobileRadial onNavigate={handleNodeClick} />
      ) : (
        <div style={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 25,
          padding: 'var(--space-16) var(--space-8)',
        }}>
          {ROWS.map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex', gap: 20 }}>
              {row.map((node) => (
                <HexNode
                  key={node.id}
                  node={node}
                  isHovered={hoveredId === node.id}
                  isFocused={focusedId === node.id}
                  isExiting={exitingId === node.id}
                  onHover={setHoveredId}
                  onClick={handleNodeClick}
                  nodeRef={(el) => { if (el) nodeRefs.current[node.id] = el }}
                  entryDelay={ENTRY_DELAY[node.id]}
                  reduced={reduced}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

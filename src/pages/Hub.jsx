import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useReducedMotion from '@/hooks/useReducedMotion'
import Badge from '@/components/ui/Badge'
import { siteStatus } from '@/data/siteStatus'
import { useSound } from '@/sound/useSound'
import HubSystemControls from '@/components/hub/HubSystemControls'

// ─── Node data ────────────────────────────────────────────────────────────────

const NODES = [
  { id: 0, label: 'PORTFOLIO', route: '/portfolio', descriptor: 'Engineering work',    icon: 'terminal'  },
  { id: 1, label: 'SKILLS',    route: '/skills',    descriptor: 'Capability matrix',   icon: 'gear'      },
  { id: 2, label: 'SERVICES',  route: '/services',  descriptor: 'Hire me',             icon: 'briefcase' },
  { id: 3, label: 'LAB',       route: '/lab',       descriptor: 'Experiments & demos', icon: 'beaker'    },
  { id: 4, label: 'STORE',     route: '/store',     descriptor: 'Products',            icon: 'cart'      },
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
    case 'gear':      return <svg viewBox="0 0 20 20" style={s}><circle cx="10" cy="10" r="2.5" {...p}/><path d="M10 3.5v2M10 14.5v2M3.5 10h2M14.5 10h2M5.6 5.6l1.5 1.5M13 13l1.5 1.5M5.6 14.4l1.5-1.5M13 7l1.5-1.5" {...p}/></svg>
    case 'briefcase': return <svg viewBox="0 0 20 20" style={s}><rect x="2" y="7" width="16" height="11" rx="1.5" {...p}/><path d="M7 7V5.5A1.5 1.5 0 018.5 4h3A1.5 1.5 0 0113 5.5V7" {...p}/><line x1="2" y1="12" x2="18" y2="12" {...p}/></svg>
    case 'beaker':    return <svg viewBox="0 0 20 20" style={s}><path d="M7.5 2v6L3 15.5a1 1 0 00.9 1.5h12.2a1 1 0 00.9-1.5L12.5 8V2" {...p}/><line x1="6" y1="2" x2="14" y2="2" {...p}/><circle cx="8.5" cy="14" r="0.8" fill="currentColor" stroke="none"/></svg>
    case 'cart':      return <svg viewBox="0 0 20 20" style={s}><path d="M1 1.5h2l2.5 9H15l2-6H5" {...p}/><circle cx="8.5" cy="17" r="1.5" {...p}/><circle cx="14.5" cy="17" r="1.5" {...p}/></svg>
    case 'play':      return <svg viewBox="0 0 20 20" style={s}><polygon points="4,2 18,10 4,18" {...p}/></svg>
    case 'profile':   return <svg viewBox="0 0 20 20" style={s}><circle cx="10" cy="6.5" r="3.5" {...p}/><path d="M2.5 19c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5" {...p}/></svg>
    case 'mail':      return <svg viewBox="0 0 20 20" style={s}><rect x="1.5" y="4" width="17" height="13" rx="1.5" {...p}/><polyline points="1.5,4 10,12 18.5,4" {...p}/></svg>
    default:          return null
  }
}

// ─── Three.js background ──────────────────────────────────────────────────────

function CameraInit() {
  const { camera } = useThree()
  useEffect(() => { camera.lookAt(0, 0, 0) }, [camera])
  return null
}

function WireframeGrid({ reduced }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(44, 44, 28, 28)
    const pos = geo.attributes.position.array
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3 + 2] = Math.sin(pos[i * 3] * 0.38) * Math.cos(pos[i * 3 + 1] * 0.38) * 0.7
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current || reduced) return
    meshRef.current.rotation.z += (delta * Math.PI * 2) / 60
  })

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2.3, 0, 0]} position={[0, -5, 0]}>
      <meshBasicMaterial color={0x00C8FF} wireframe transparent opacity={0.09} />
    </mesh>
  )
}

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
        animation: (!active && !reduced) ? `nodeIdle 3.2s ease-in-out ${entryDelay * 0.5}s infinite` : 'none',
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
      {/* Hex border via SVG */}
      <svg
        width={HEX_W}
        height={HEX_H}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
          filter: isExiting
            ? 'drop-shadow(0 0 18px rgba(0,200,255,0.65)) drop-shadow(0 0 50px rgba(0,200,255,0.35))'
            : active
              ? 'drop-shadow(0 0 14px rgba(0,200,255,0.45)) drop-shadow(0 0 36px rgba(0,200,255,0.20))'
              : 'drop-shadow(0 0 8px rgba(0,200,255,0.20)) drop-shadow(0 0 20px rgba(0,200,255,0.08))',
          transition: reduced ? undefined : 'filter 250ms ease-out',
        }}
      >
        {/* Base fill + stroke */}
        <polygon
          points={HEX_POINTS}
          fill="var(--color-bg-surface)"
          stroke="#00C8FF"
          strokeWidth={1.5}
          style={{
            strokeOpacity: active ? 1 : 0.6,
            transition: reduced ? undefined : 'stroke-opacity 200ms',
          }}
        />
        {/* Inner glow overlay — opacity controls idle vs hover intensity; fades on exit */}
        <polygon
          points={HEX_POINTS}
          fill="var(--color-bg-surface)"
          stroke="none"
          filter="url(#hexInnerGlow)"
          style={{
            opacity: isExiting ? 0 : active ? 1 : 0.6,
            transition: reduced ? undefined : 'opacity 250ms ease-out',
            pointerEvents: 'none',
          }}
        />
        {isFocused && (
          <polygon
            points={HEX_POINTS}
            fill="none"
            stroke="var(--color-accent-primary)"
            strokeWidth={2.5}
            opacity={0.5}
            style={{ filter: 'drop-shadow(0 0 5px rgba(0,200,255,0.7))' }}
          />
        )}
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
        color: active ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
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
              color: '#FFFFFF',
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

// ─── Mobile radial drawer ─────────────────────────────────────────────────────

function MobileRadial({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const RADIUS = 185

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

      {/* Radial nodes + center button */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {NODES.map((node, i) => {
          const angle = ((i * 360) / 8 - 90) * (Math.PI / 180)
          const tx = Math.cos(angle) * RADIUS
          const ty = Math.sin(angle) * RADIUS

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
                width: 82,
                marginLeft: -41,
                marginTop: -18,
                background: 'var(--color-bg-surface)',
                border: '1px solid rgba(0,200,255,0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-3)',
                cursor: 'crosshair',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 'var(--weight-medium)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
                pointerEvents: open ? 'auto' : 'none',
              }}
            >
              {node.label}
            </motion.button>
          )
        })}

        {/* Center toggle button */}
        <motion.button
          animate={{ background: open ? 'var(--color-accent-primary)' : 'var(--color-bg-elevated)' }}
          transition={{ duration: 0.2 }}
          onClick={() => setOpen((v) => !v)}
          style={{
            position: 'relative',
            zIndex: 2,
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
          }}
        >
          {open ? 'CLOSE' : 'OPEN TERMINAL'}
        </motion.button>
      </div>
    </div>
  )
}

// ─── Hub page ─────────────────────────────────────────────────────────────────

export default function Hub() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()

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
      {/* ── Three.js background ── */}
      <Canvas
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        camera={{ position: [0, 8, 14], fov: 50 }}
        frameloop={reduced ? 'demand' : 'always'}
        gl={{ antialias: false, alpha: true }}
      >
        <CameraInit />
        <WireframeGrid reduced={reduced} />
      </Canvas>

      {/* ── SVG filter defs (shared by all hex nodes) ── */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <filter id="hexInnerGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology operator="erode" radius="1" in="SourceAlpha" result="eroded" />
            <feGaussianBlur in="eroded" stdDeviation="3" result="blurred" />
            <feFlood floodColor="#00C8FF" floodOpacity="0.70" result="color" />
            <feComposite in="color" in2="blurred" operator="in" result="innerGlow" />
            <feComposite in="SourceGraphic" in2="innerGlow" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* ── Scan-line ── */}
      {!reduced && (
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            height: 3,
            background: 'linear-gradient(transparent, rgba(0,200,255,0.05), transparent)',
            animation: 'scanLine 10s linear infinite',
          }} />
        </div>
      )}

      {/* ── UI overlay ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
        {/* Top-left */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            position: 'absolute',
            top: 'var(--space-6)',
            left: 'var(--space-6)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
          }}
        >
          FRESH PRINTS // OPERATIONS TERMINAL
        </motion.div>

        {/* Top-right */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{
            position: 'absolute',
            top: 'var(--space-6)',
            right: 'var(--space-6)',
            pointerEvents: 'auto',
          }}
        >
          <Badge status="ACTIVE" pulse={!reduced} label="ONLINE" />
        </motion.div>

        {/* Bottom-left */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            position: 'absolute',
            bottom: 'var(--space-6)',
            left: 'var(--space-6)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          {siteStatus.availabilityNote}
        </motion.div>

        {/* Bottom-right */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            position: 'absolute',
            bottom: 'var(--space-6)',
            right: 'var(--space-6)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          LAST SYNC: {siteStatus.lastUpdated}
        </motion.div>
      </div>

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

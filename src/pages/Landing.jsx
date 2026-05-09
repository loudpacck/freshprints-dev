import { useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useReducedMotion from '@/hooks/useReducedMotion'
import Button from '@/components/ui/Button'

const COUNT = 80

function ParticleField({ reduced }) {
  const pointsRef = useRef()
  const mouse = useRef([0, 0])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useEffect(() => {
    if (reduced) return
    const handler = (e) => {
      mouse.current = [
        (e.clientX / window.innerWidth - 0.5) * 2,
        -(e.clientY / window.innerHeight - 0.5) * 2,
      ]
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [reduced])

  useFrame((state, delta) => {
    if (!pointsRef.current || reduced) return
    const pos = geometry.attributes.position.array
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] += delta * 0.25
      if (pos[i * 3 + 1] > 10) pos[i * 3 + 1] = -10
    }
    geometry.attributes.position.needsUpdate = true

    const cam = state.camera
    cam.position.x += (mouse.current[0] * 0.8 - cam.position.x) * 0.03
    cam.position.y += (mouse.current[1] * 0.8 - cam.position.y) * 0.03
    cam.lookAt(0, 0, 0)
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={0x88E5FF}
        size={0.09}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function fadeUp(delay, reduced) {
  if (reduced) return {}
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
  }
}

export default function Landing() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.')

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}
    >
      {/* Background particle canvas */}
      <Canvas
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        camera={{ position: [0, 0, 12], fov: 55 }}
        frameloop={reduced ? 'demand' : 'always'}
        gl={{ antialias: false, alpha: true }}
      >
        <ParticleField reduced={reduced} />
      </Canvas>

      {/* Centered content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-6)',
          textAlign: 'center',
          padding: 'var(--space-8)',
        }}
      >
        <motion.span
          {...fadeUp(0.0, reduced)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-widest)',
          }}
        >
          FRESHPRINTS.DEV
        </motion.span>

        <motion.h1
          {...fadeUp(0.3, reduced)}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-hero)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-tight)',
            margin: 0,
          }}
        >
          ENGINEER. DEVELOPER. BUILDER.
        </motion.h1>

        <motion.p
          {...fadeUp(0.6, reduced)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          Mechanical design, software, games, AI.
        </motion.p>

        <motion.div {...fadeUp(0.9, reduced)}>
          <div className="landing-enter-aura">
            <Button size="lg" onClick={() => navigate('/hub')}>
              ENTER
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Bottom-left version */}
      <motion.span
        initial={reduced ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          left: 'var(--space-6)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          zIndex: 1,
        }}
      >
        v1.0 // INITIALIZED
      </motion.span>

      {/* Bottom-right date */}
      <motion.span
        initial={reduced ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          right: 'var(--space-6)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          zIndex: 1,
        }}
      >
        {today}
      </motion.span>
    </motion.div>
  )
}

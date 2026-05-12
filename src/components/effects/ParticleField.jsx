import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useReducedMotion from '@/hooks/useReducedMotion'

const COUNT = 80

function Particles({ reduced }) {
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

export default function ParticleField() {
  const reduced = useReducedMotion()

  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      camera={{ position: [0, 0, 12], fov: 55 }}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ antialias: false, alpha: true }}
    >
      <Particles reduced={reduced} />
    </Canvas>
  )
}

import { lazy, Suspense } from 'react'
import useReducedMotion from '@/hooks/useReducedMotion'
import useDeferredMount from '@/hooks/useDeferredMount'

const ParticleField = lazy(() => import('./ParticleField'))

// Keeps the three.js chunk off the first-paint path: the canvas mounts only
// after the browser goes idle, and never under prefers-reduced-motion.
// Renders nothing while loading — the page's static background shows through.
export default function DeferredParticleField() {
  const reduced = useReducedMotion()
  const ready = useDeferredMount()

  if (reduced || !ready) return null

  return (
    <Suspense fallback={null}>
      <ParticleField />
    </Suspense>
  )
}

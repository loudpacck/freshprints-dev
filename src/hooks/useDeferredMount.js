import { useEffect, useState } from 'react'

// Returns false on first paint, flipping true once the browser goes idle.
// Used to keep heavy visual chunks (three.js canvases) off the critical path.
export default function useDeferredMount() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(() => setReady(true), 200)
    return () => window.clearTimeout(id)
  }, [])

  return ready
}

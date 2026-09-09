import { useEffect, useRef } from 'react'

/**
 * Code rain — Hub only.
 *
 * Deliberately atmosphere, not screensaver: sparse columns (roughly one in
 * four carries a drop at any time), slow fall, and modest opacity so the hex
 * nodes stay the focus. Trails draw in the muted phosphor token with a bright
 * accent head.
 *
 * Plain <canvas>, no library — this replaced a three.js scene that cost an
 * ~868KB chunk.
 *
 * Do NOT import this from any other page. The rain belongs to the hub and
 * nowhere else; inner pages get the scanline overlay and nothing more.
 *
 * Self-skips (renders nothing at all, not a static frame) when the viewer
 * prefers reduced motion or the viewport is under 768px. Pauses on
 * visibilitychange and tears the RAF down on unmount.
 */

const MOBILE_BREAKPOINT = 768
const FONT_SIZE = 15
const COLUMN_WIDTH = 20
const FALL_SPEED = 55          // px/sec — slow; a drop takes ~19s to cross
// Per column, per frame. Tuned against the ~19s a drop lives so that only
// about a quarter of the columns carry one at any moment: sparse, not a wall.
const SPAWN_CHANCE = 0.0003
const TRAIL_LENGTH = 14
const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789<>[]{}/\\|=+-*'

export default function HubRain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    // Belt and braces: Hub already gates on these, but the component must be
    // safe to mount on its own terms too.
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) return
    if (window.innerWidth < MOBILE_BREAKPOINT) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = null
    let running = true
    let lastTime = 0
    let columns = []
    let width = 0
    let height = 0

    // Colors are read off the live theme so light mode prints in ink, not
    // phosphor, without this component knowing either palette.
    const styles = getComputedStyle(document.documentElement)
    // Trails draw in the secondary phosphor rather than --color-text-muted:
    // muted is so dark that at any alpha low enough to stay background it
    // disappears entirely. Secondary at a low alpha lands at the same
    // perceived dimness while actually being legible as rain.
    const trailColor = styles.getPropertyValue('--color-text-secondary').trim() || '#5FA86E'
    const accentColor = styles.getPropertyValue('--color-accent-primary').trim() || '#33FF66'

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `${FONT_SIZE}px "IBM Plex Mono", "Courier New", monospace`
      ctx.textBaseline = 'top'

      const count = Math.ceil(width / COLUMN_WIDTH)
      columns = Array.from({ length: count }, () => ({ y: null, glyphs: [] }))
    }

    function randomGlyph() {
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    }

    function frame(time) {
      if (!running) return
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0
      lastTime = time

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i]

        // Sparse: most columns sit empty most of the time.
        if (col.y === null) {
          if (Math.random() < SPAWN_CHANCE) {
            col.y = -FONT_SIZE * TRAIL_LENGTH * Math.random()
            col.glyphs = Array.from({ length: TRAIL_LENGTH }, randomGlyph)
          }
          continue
        }

        col.y += FALL_SPEED * delta
        if (col.y - TRAIL_LENGTH * FONT_SIZE > height) {
          col.y = null
          continue
        }

        // Occasionally churn one glyph so the trail reads as live data.
        if (Math.random() < 0.04) {
          col.glyphs[Math.floor(Math.random() * TRAIL_LENGTH)] = randomGlyph()
        }

        const x = i * COLUMN_WIDTH + 3
        for (let t = 0; t < TRAIL_LENGTH; t++) {
          const y = col.y - t * FONT_SIZE
          if (y < -FONT_SIZE || y > height) continue
          const isHead = t === 0
          // Head is bright accent; the tail fades out behind it. Kept low
          // enough that the hex nodes still read as the focus of the page.
          ctx.globalAlpha = isHead ? 0.90 : 0.55 * (1 - t / TRAIL_LENGTH)
          ctx.fillStyle = isHead ? accentColor : trailColor
          ctx.fillText(col.glyphs[t], x, y)
        }
      }
      ctx.globalAlpha = 1

      rafId = requestAnimationFrame(frame)
    }

    function start() {
      if (rafId !== null) return
      running = true
      lastTime = 0
      rafId = requestAnimationFrame(frame)
    }

    function stop() {
      running = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    function onVisibility() {
      if (document.hidden) stop()
      else start()
    }

    // If the viewer flips reduced motion on mid-session, stop and stay stopped.
    function onMotionChange(e) {
      if (e.matches) {
        stop()
        ctx.clearRect(0, 0, width, height)
      } else {
        start()
      }
    }

    resize()
    start()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    motionQuery.addEventListener('change', onMotionChange)

    return () => {
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotionChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

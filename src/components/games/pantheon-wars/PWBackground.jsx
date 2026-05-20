import { useEffect, useRef } from 'react'
import useReducedMotion from '@/hooks/useReducedMotion'

// Variant configs — control particle feel per page
const VARIANTS = {
  dashboard:   { count: 55, baseSpeed: 0.18, color: [201, 169,  97], flashChance: 0 },
  quests:      { count: 45, baseSpeed: 0.14, color: [237, 227, 204], flashChance: 0 },
  arena:       { count: 70, baseSpeed: 0.38, color: [184,  88,  58], flashChance: 0.003 },
  inventory:   { count: 60, baseSpeed: 0.20, color: [201, 169,  97], flashChance: 0.001 },
  shop:        { count: 60, baseSpeed: 0.20, color: [201, 169,  97], flashChance: 0.004 },
  temples:     { count: 50, baseSpeed: 0.16, color: [201, 169,  97], flashChance: 0 },
  pvplog:      { count: 45, baseSpeed: 0.25, color: [160,  90,  70], flashChance: 0 },
  leaderboard: { count: 58, baseSpeed: 0.22, color: [201, 169,  97], flashChance: 0 },
  profile:     { count: 55, baseSpeed: 0.18, color: [201, 169,  97], flashChance: 0 },
  adventures:  { count: 55, baseSpeed: 0.22, color: [210, 150,  80], flashChance: 0.002 },
  titan:       { count: 85, baseSpeed: 0.42, color: [180,  60,  80], flashChance: 0.006 },
  township:    { count: 48, baseSpeed: 0.14, color: [120, 160, 100], flashChance: 0 },
  codex:       { count: 35, baseSpeed: 0.08, color: [200, 180, 140], flashChance: 0 },
}

function makeParticle(canvas, cfg) {
  const [r, g, b] = cfg.color
  const alpha = 0.08 + Math.random() * 0.22
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    // drift direction: mostly upward with slight lateral spread
    vx: (Math.random() - 0.5) * cfg.baseSpeed * 0.6,
    vy: -cfg.baseSpeed * (0.4 + Math.random() * 0.6),
    radius: 0.8 + Math.random() * 1.6,
    alpha,
    baseAlpha: alpha,
    r, g, b,
    flash: 0, // 0..1 flash intensity, decays over time
  }
}

export default function PWBackground({ variant = 'dashboard' }) {
  const prefersReduced = useReducedMotion()
  const canvasRef = useRef(null)
  const cfg = VARIANTS[variant] || VARIANTS.dashboard

  useEffect(() => {
    if (prefersReduced) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let width = 0
    let height = 0
    let particles = []
    let animId = null
    let lastTime = 0
    let paused = false

    function resize() {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    function init() {
      resize()
      particles = Array.from({ length: cfg.count }, () => makeParticle(canvas, cfg))
    }

    function tick(now) {
      if (paused) {
        animId = requestAnimationFrame(tick)
        return
      }
      const dt = Math.min((now - lastTime) / 16.67, 3) // delta in 60fps units, capped
      lastTime = now

      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        // Move
        p.x += p.vx * dt
        p.y += p.vy * dt

        // Wrap around edges
        if (p.y < -4)        p.y = height + 4
        if (p.y > height + 4) p.y = -4
        if (p.x < -4)        p.x = width + 4
        if (p.x > width + 4)  p.x = -4

        // Coin flash for shop/inventory
        if (cfg.flashChance > 0 && Math.random() < cfg.flashChance * dt) {
          p.flash = 1.0
        }
        if (p.flash > 0) {
          p.flash = Math.max(0, p.flash - 0.04 * dt)
        }

        const drawAlpha = p.flash > 0
          ? p.baseAlpha + p.flash * 0.55
          : p.baseAlpha

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius + (p.flash > 0 ? p.flash * 1.5 : 0), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${drawAlpha.toFixed(3)})`
        ctx.fill()
      }

      animId = requestAnimationFrame(tick)
    }

    function handleVisibility() {
      paused = document.hidden
    }

    init()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', handleVisibility)
    animId = requestAnimationFrame(t => { lastTime = t; tick(t) })

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [variant, prefersReduced, cfg])

  // Static fallback for prefers-reduced-motion
  if (prefersReduced) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(201,169,97,0.06) 0%, transparent 60%)',
        }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  )
}

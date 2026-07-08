import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useTheme } from '@/themes/useTheme'
import useReducedMotion from '@/hooks/useReducedMotion'
import BlobertBlob from './BlobertBlob'
import { getSkin } from './blobertSkins'

// Silent, chat-less Blobert for the Landing splash ('/'). He roams the safe
// margins of the viewport, never overlapping the title/CTA, sends nothing to the
// API, and speaks no words. Reusable with zero props — reads the active theme
// from context, so any future per-theme splash gets the right skin for free.

const SIZE = 60
const MARGIN = 16 // keep him this far from the viewport edges
const AMBIENT_CLICK_KEY = 'blobert-ambient-clicks' // session easter-egg counter

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// A protected rectangle around the centered Landing title + ENTER CTA. Generous
// padding — the blob's whole box must stay clear of it while roaming.
function protectedRect(w, h) {
  return { x0: w * 0.16, y0: h * 0.24, x1: w * 0.84, y1: h * 0.76 }
}

// Reject-sample a waypoint (blob top-left) inside an allowed zone (lower third or
// side margins) that doesn't intersect the protected center rect. Falls back to a
// bottom corner if sampling fails.
function computeWaypoint() {
  const w = window.innerWidth
  const h = window.innerHeight
  const prot = protectedRect(w, h)
  const maxX = w - SIZE - MARGIN
  const maxY = h - SIZE - MARGIN
  for (let i = 0; i < 40; i++) {
    const x = MARGIN + Math.random() * (maxX - MARGIN)
    const y = MARGIN + Math.random() * (maxY - MARGIN)
    const inLowerThird = y > h * 0.64
    const inSideMargin = x < w * 0.14 || x > w * 0.86 - SIZE
    if (!inLowerThird && !inSideMargin) continue
    const overlaps = x < prot.x1 && x + SIZE > prot.x0 && y < prot.y1 && y + SIZE > prot.y0
    if (overlaps) continue
    return { x, y }
  }
  return { x: maxX, y: maxY } // bottom-right fallback
}

// Off-screen edge start so he can wander in after the splash lands.
function edgeStart() {
  const w = window.innerWidth
  const h = window.innerHeight
  const r = Math.random()
  if (r < 0.34) return { x: -SIZE - 24, y: h * 0.74 }
  if (r < 0.67) return { x: w + 24, y: h * 0.74 }
  return { x: w * 0.5 - SIZE / 2, y: h + 24 }
}

function cornerPos(side) {
  const w = window.innerWidth
  const h = window.innerHeight
  const y = h - SIZE - MARGIN
  return side === 'left' ? { x: MARGIN, y } : { x: w - SIZE - MARGIN, y }
}

export default function BlobertAmbient() {
  const { themeId } = useTheme()
  const reduced = useReducedMotion()
  const skin = getSkin(themeId)

  const roam = useAnimationControls()   // outer layer: position (x/y translate)
  const react = useAnimationControls()  // inner layer: hop / wiggle / spin

  const [ready, setReady] = useState(false) // hold ~1.5s so the splash lands first
  const [wide, setWide] = useState(false)   // startled eyes
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const wideTimerRef = useRef(null)

  // Delay entrance so the cinematic Landing intro can play uninterrupted.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => () => clearTimeout(wideTimerRef.current), [])

  // --- Desktop: roam between safe waypoints ----------------------------------
  useEffect(() => {
    if (!ready || reduced || isMobile) return undefined
    let active = true

    roam.set(edgeStart())
    ;(async () => {
      // Wander in from the edge to a first waypoint.
      await roam.start({ ...computeWaypoint(), transition: { duration: 2.2, ease: 'easeInOut' } })
      while (active) {
        const pause = 3000 + Math.random() * 5000
        await wait(pause)
        if (!active) break
        // Occasional tiny idle bounce (inner layer, so it won't disturb position).
        if (Math.random() < 0.5) {
          await react.start({ y: [0, -6, 0], transition: { duration: 0.5, ease: 'easeInOut' } })
        }
        if (!active) break
        const wp = computeWaypoint()
        const dur = 4 + Math.random() * 3
        await roam.start({ ...wp, transition: { duration: dur, ease: 'easeInOut' } })
      }
    })()

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduced, isMobile])

  // --- Mobile: sit in a corner, rare scoot to the other corner ---------------
  useEffect(() => {
    if (!ready || reduced || !isMobile) return undefined
    let active = true
    let side = 'right'
    roam.set(cornerPos(side))
    ;(async () => {
      while (active) {
        await wait(45000 + Math.random() * 20000)
        if (!active) break
        side = side === 'right' ? 'left' : 'right'
        await roam.start({ ...cornerPos(side), transition: { duration: 0.6, ease: 'easeOut' } })
      }
    })()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduced, isMobile])

  // --- Reduced motion: static bottom-right corner ----------------------------
  useEffect(() => {
    if (!ready || !reduced) return
    roam.set(cornerPos('right'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduced])

  function handlePoke() {
    // Eyes-wide on every poke (the only reaction under reduced motion).
    setWide(true)
    clearTimeout(wideTimerRef.current)
    wideTimerRef.current = setTimeout(() => setWide(false), 700)

    // Easter-egg: every 5th poke in a session, a full 360 spin.
    let count = Number(sessionStorage.getItem(AMBIENT_CLICK_KEY) || 0) + 1
    sessionStorage.setItem(AMBIENT_CLICK_KEY, String(count))

    if (reduced) return
    ;(async () => {
      // Startled hop + happy wiggle.
      await react.start({ y: [0, -22, 0], rotate: [0, -8, 8, -5, 0], transition: { duration: 0.6, ease: 'easeOut' } })
      if (count % 5 === 0) {
        await react.start({ rotate: 360, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } })
        react.set({ rotate: 0 })
      }
    })()
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 800,
        pointerEvents: 'none', // container never blocks the ENTER CTA or corners
        overflow: 'hidden',
      }}
    >
      <motion.div
        animate={roam}
        initial={false}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: SIZE,
          height: SIZE,
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        <motion.button
          type="button"
          animate={react}
          onClick={handlePoke}
          aria-label="Poke Blobert"
          tabIndex={-1}
          style={{
            width: SIZE,
            height: SIZE,
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            pointerEvents: 'auto', // only the blob itself is interactive
            display: 'block',
          }}
        >
          <BlobertBlob skin={skin} reduced={reduced} state={wide ? 'wide' : 'idle'} size={SIZE} />
        </motion.button>
      </motion.div>
    </div>
  )
}

// Pure helpers for Blobert's Phase 2 personality: idle acts, nap poses, snore
// variants, gaze targets, and nudge governor constants. No React, no DOM state —
// just deterministic-ish helpers the widget calls. (isInputFocused touches the
// DOM read-only; it lives here so the governor logic stays in one place.)

// --- Idle scheduler ----------------------------------------------------------
export const IDLE_MIN_MS = 12000
export const IDLE_MAX_MS = 30000
export const YAWN_IDLE_MS = 90000 // zero-interaction threshold before he yawns

// Weighted idle-act pool per theme. micro-bounce is deliberately rare. Standard
// gets no flavor act — composed is his standard-theme personality.
function idleActPool(theme) {
  const base = [
    { type: 'glance', weight: 4 },
    { type: 'sway', weight: 3 },
    { type: 'bounce', weight: 1 },
  ]
  if (theme === 'funky' || theme === 'digital' || theme === 'retro') {
    base.push({ type: 'flavor', weight: 2 })
  }
  return base
}

// Never repeat the previous act type back-to-back.
export function pickIdleAct(theme, lastType) {
  const pool = idleActPool(theme).filter(a => a.type !== lastType)
  const total = pool.reduce((s, a) => s + a.weight, 0)
  let r = Math.random() * total
  for (const a of pool) { r -= a.weight; if (r <= 0) return a.type }
  return pool[0].type
}

// Blob sits bottom-right, so "toward page center" reads as an up-left glance.
export function centerGaze() { return { x: -0.55, y: -0.55 } }
export function randomGlanceGaze() {
  if (Math.random() < 0.4) return centerGaze()
  const ang = Math.random() * Math.PI * 2
  const mag = 0.5 + Math.random() * 0.5
  return { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag }
}

// --- Nap poses ---------------------------------------------------------------
// puddle (fully flattened) is reserved for the skins where it reads as play;
// standard/digital keep the subtler two.
function napPoses(theme) {
  const poses = ['normal', 'slump']
  if (theme === 'funky' || theme === 'retro') poses.push('puddle')
  return poses
}
export function pickNapPose(theme, last) {
  const poses = napPoses(theme).filter(p => p !== last)
  const pool = poses.length ? poses : napPoses(theme)
  return pool[Math.floor(Math.random() * pool.length)] || 'normal'
}
export function poseTransform(pose) {
  if (pose === 'slump') return 'translateY(5px) rotate(11deg)'
  if (pose === 'puddle') return 'translateY(11px) scaleX(1.22) scaleY(0.5)'
  return 'none'
}

// --- Snore variants ----------------------------------------------------------
// 'bubble' (grows + pops) is skipped under reduced motion.
export function pickSnore(reduced) {
  const r = Math.random()
  if (r < 0.6) return 'zzz'
  if (r < 0.85) return 'bigZ'
  return reduced ? 'zzz' : 'bubble'
}

// --- Nudge governors (all enforced in BlobertWidget's one interval) ----------
export const NUDGE_SESSION_CAP = 4
export const NUDGE_MIN_GAP_MS = 90000        // between any two nudges
export const NUDGE_PAGE_MIN_MS = 30000       // never within first 30s on a page
export const NUDGE_INTERACTION_COOLDOWN_MS = 60000 // since last Blobert interaction
export const NUDGE_DWELL_MS = 45000          // trigger 1: dwell-no-chat
export const NUDGE_TONE_MS = 30000           // trigger 2: tone-toggle (/hire)
export const NUDGE_THEME_MS = 60000          // trigger 3: theme-tease
export const NUDGE_FACT_DWELL_MS = 4000      // trigger 4: card in view this long
export const NUDGE_AUTOHIDE_MS = 8000        // bubble self-dismiss if untouched

// Read-only DOM check: is any text-entry field focused anywhere on the page?
export function isInputFocused() {
  const el = typeof document !== 'undefined' && document.activeElement
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true
}

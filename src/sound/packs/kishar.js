import { soundManager } from '../SoundManager'

/**
 * Kishar sound pack — 100% procedural Web Audio. No mp3s, no file loads.
 *
 * Deliberately does NOT import src/sound/packs/pantheon.js: that pack is the
 * live game's and is half file-backed. The synth shapes here started from its
 * procedural half and were retuned warmer and woodier — struck wood, a brass
 * rim, a soft page turn — to match leather and gilding rather than neon.
 *
 * Muted by default (see SoundManager._defaultMuted), like Digital.
 */

const clamp = (v) => Math.max(0, Math.min(1, v))

// A struck body: short noise burst through a band-pass. Reads as wood or leather.
function strike(ctx, mv, { freq = 900, q = 6, dur = 0.05, gain = 0.3 }) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(freq, ctx.currentTime)
  filter.Q.setValueAtTime(q, ctx.currentTime)
  const g = ctx.createGain()
  g.gain.setValueAtTime(clamp(mv * gain), ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
  src.connect(filter)
  filter.connect(g)
  g.connect(ctx.destination)
  src.start(ctx.currentTime)
  src.stop(ctx.currentTime + dur)
}

// A struck metal tone: triangle partial with a slow decay. Reads as a small bell.
function tone(ctx, mv, { from, to = from, dur = 0.2, gain = 0.25, type = 'triangle', delay = 0 }) {
  const t = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(clamp(mv * gain), t + Math.min(0.02, dur * 0.2))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + dur)
}

// ─── The 13 ──────────────────────────────────────────────────────────────────

function click(ctx, mv) {
  strike(ctx, mv, { freq: 780, q: 5, dur: 0.045, gain: 0.28 })
  tone(ctx, mv, { from: 220, dur: 0.06, gain: 0.12, type: 'sine' })
}

function hover(ctx, mv) {
  // A page edge brushing past — very quiet, no pitch.
  strike(ctx, mv, { freq: 2600, q: 1.2, dur: 0.045, gain: 0.05 })
}

function activate(ctx, mv) {
  // Bronze rim, rising.
  tone(ctx, mv, { from: 330, to: 520, dur: 0.22, gain: 0.2 })
  tone(ctx, mv, { from: 660, to: 1040, dur: 0.18, gain: 0.07, delay: 0.01 })
}

function select(ctx, mv) {
  // A seal pressed home: struck body, then a settled fifth.
  strike(ctx, mv, { freq: 520, q: 4, dur: 0.07, gain: 0.3 })
  tone(ctx, mv, { from: 392, dur: 0.26, gain: 0.18 })
  tone(ctx, mv, { from: 588, dur: 0.22, gain: 0.09, delay: 0.03 })
}

function modalOpen(ctx, mv) {
  // A cover lifting: low body swelling under a soft high partial.
  tone(ctx, mv, { from: 196, to: 294, dur: 0.28, gain: 0.2, type: 'sine' })
  strike(ctx, mv, { freq: 1800, q: 1.5, dur: 0.12, gain: 0.06 })
}

function modalClose(ctx, mv) {
  tone(ctx, mv, { from: 294, to: 175, dur: 0.2, gain: 0.18, type: 'sine' })
  strike(ctx, mv, { freq: 420, q: 3, dur: 0.06, gain: 0.16 })
}

function success(ctx, mv) {
  // An open fourth, then the octave. Consonant, no fanfare.
  tone(ctx, mv, { from: 392, dur: 0.24, gain: 0.24 })
  tone(ctx, mv, { from: 523.25, dur: 0.3, gain: 0.22, delay: 0.11 })
  tone(ctx, mv, { from: 784, dur: 0.36, gain: 0.12, delay: 0.22 })
}

function error(ctx, mv) {
  // Flat, dull, unresonant — a stamp refused.
  tone(ctx, mv, { from: 175, to: 138, dur: 0.28, gain: 0.24, type: 'sawtooth' })
  strike(ctx, mv, { freq: 300, q: 2, dur: 0.1, gain: 0.14 })
}

function toggle(ctx, mv) {
  strike(ctx, mv, { freq: 1150, q: 7, dur: 0.035, gain: 0.22 })
}

function terminalKey(ctx, mv) {
  // Nib on vellum.
  strike(ctx, mv, { freq: 3200, q: 0.9, dur: 0.022, gain: 0.09 })
}

const terminalOpen = modalOpen
const terminalClose = modalClose
const terminalSubmit = success

const kisharPack = {
  click,
  hover,
  activate,
  select,
  terminalOpen,
  terminalClose,
  terminalKey,
  terminalSubmit,
  modalOpen,
  modalClose,
  success,
  error,
  toggle,
}

soundManager.registerPack('kishar', kisharPack)

export default kisharPack

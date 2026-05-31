import { soundManager } from '../SoundManager'

/* ============================================================
   Funky sound pack — soft synth bloops, rubbery pops, smooth
   whooshes, bass plucks, liquid droplets. Every sound is freshly
   designed — nothing borrowed from the digital or retro packs.
   ============================================================ */

// Soft synth bloop — triangle blip with a gentle pitch bend up, vibrato-free, 90ms
function click(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(420, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.06)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.35, ctx.currentTime + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.09)
}

// Liquid droplet — quick sine plip with a downward bend, lightly low-passed, 70ms
function hover(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2600, ctx.currentTime)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1100, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.05)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.09, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.07)
}

// Rubbery pop — sine with fast frequency wobble (FM-ish) giving a bouncy "boing", 200ms
function select(ctx, mv) {
  const carrier = ctx.createOscillator()
  const mod = ctx.createOscillator()
  const modGain = ctx.createGain()
  const gain = ctx.createGain()
  carrier.type = 'sine'
  carrier.frequency.setValueAtTime(300, ctx.currentTime)
  carrier.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.18)
  mod.type = 'sine'
  mod.frequency.setValueAtTime(14, ctx.currentTime)
  mod.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.18)
  modGain.gain.setValueAtTime(120, ctx.currentTime)
  modGain.gain.exponentialRampToValueAtTime(20, ctx.currentTime + 0.18)
  mod.connect(modGain)
  modGain.connect(carrier.frequency)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.38, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  carrier.connect(gain)
  gain.connect(ctx.destination)
  carrier.start(ctx.currentTime)
  mod.start(ctx.currentTime)
  carrier.stop(ctx.currentTime + 0.2)
  mod.stop(ctx.currentTime + 0.2)
}

// Bass pluck — short filtered saw with a quick decay, warm and round, 160ms
function activate(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1400, ctx.currentTime)
  filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.16)
  filter.Q.setValueAtTime(6, ctx.currentTime)
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(180, ctx.currentTime)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.22, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.16)
}

// Smooth whoosh — filtered noise sweeping through a moving band-pass, 320ms
function whoosh(ctx, mv) {
  const duration = 0.32
  const bufSize = Math.floor(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(300, ctx.currentTime)
  filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + duration)
  filter.Q.setValueAtTime(1.5, ctx.currentTime)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.3, ctx.currentTime + 0.08)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  noise.start(ctx.currentTime)
  noise.stop(ctx.currentTime + duration)
}

// Modal open — upward liquid whoosh layered with a soft bloop, 300ms
function modalOpen(ctx, mv) {
  whoosh(ctx, mv * 0.7)
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(380, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.2)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.25, ctx.currentTime + 0.06)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.28)
}

// Modal close — descending sine with a gentle band-pass tail, 220ms
function modalClose(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(680, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.2)
  gain.gain.setValueAtTime(mv * 0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.22)
}

// Success — three rising bloops in a bright pentatonic shimmer, ~360ms
function success(ctx, mv) {
  ;[[523.25, 0], [659.25, 0.1], [880, 0.2]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delay
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.12)
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(mv * 0.32, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.14)
  })
}

// Error — soft detuned "wobble down", a rubbery low warble, 300ms
function error(ctx, mv) {
  ;[0, 7].forEach((detune) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.detune.setValueAtTime(detune, ctx.currentTime)
    osc.frequency.setValueAtTime(260, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.28)
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(mv * 0.26, ctx.currentTime + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  })
}

// Toggle — tiny round droplet pop, 60ms
function toggle(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(560, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.04)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.28, ctx.currentTime + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.06)
}

// Soft keystroke — muted triangle tick with a touch of body, 25ms
function keyType(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1600, ctx.currentTime)
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(640, ctx.currentTime)
  gain.gain.setValueAtTime(mv * 0.14, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.025)
}

const funkyPack = {
  // native funky keys
  click,
  hover,
  select,
  activate,
  whoosh,
  modalOpen,
  modalClose,
  success,
  error,
  toggle,
  keyType,
  // digital-named aliases so shared components never hit a missing sound
  terminalOpen:   modalOpen,
  terminalClose:  modalClose,
  terminalKey:    keyType,
  terminalSubmit: success,
}

soundManager.registerPack('funky', funkyPack)

export default funkyPack

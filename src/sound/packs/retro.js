import { soundManager } from '../SoundManager'

// Chunky button click — filtered noise burst, 50ms
function click(ctx, mv) {
  const bufSize = Math.floor(ctx.sampleRate * 0.05)
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(800, ctx.currentTime)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(mv * 0.6, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  noise.start(ctx.currentTime)
  noise.stop(ctx.currentTime + 0.05)
}

// Very quiet single beep — 880Hz sine, 80ms
function hover(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.06, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.08)
}

// Two-tone ascending beep — 660Hz then 880Hz, 120ms
function select(ctx, mv) {
  ;[[660, 0], [880, 0.07]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delay
    osc.type = 'square'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(mv * 0.25, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.06)
  })
}

// Win95 error — tritone "uh-oh" pattern, 400ms
function error(ctx, mv) {
  ;[[587, 0], [523, 0.13], [466, 0.26]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delay
    osc.type = 'square'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(mv * 0.3, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  })
}

// Three ascending notes — 523Hz, 659Hz, 784Hz, 500ms total
function success(ctx, mv) {
  ;[[523, 0], [659, 0.12], [784, 0.24]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delay
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(mv * 0.4, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.15)
  })
}

// Window opening — sweep up from 300→800Hz, 200ms
function modalOpen(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.3, ctx.currentTime + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.2)
}

// Window closing — sweep down from 600→200Hz, 150ms
function modalClose(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15)
  gain.gain.setValueAtTime(mv * 0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.15)
}

// Floppy read — filtered noise burst, mechanical, 600ms
function floppyRead(ctx, mv) {
  const duration = 0.6
  const bufSize = Math.floor(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) {
    // Chopped noise to simulate seek head
    const chunk = Math.floor(i / (ctx.sampleRate * 0.04))
    data[i] = chunk % 2 === 0 ? (Math.random() * 2 - 1) * 0.6 : 0
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1200, ctx.currentTime)
  filter.Q.setValueAtTime(0.8, ctx.currentTime)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(mv * 0.4, ctx.currentTime)
  gain.gain.setValueAtTime(mv * 0.4, ctx.currentTime + duration - 0.1)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  noise.start(ctx.currentTime)
  noise.stop(ctx.currentTime + duration)
}

// Floppy write — more sustained mechanical noise, 800ms
function floppyWrite(ctx, mv) {
  const duration = 0.8
  const bufSize = Math.floor(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) {
    const chunk = Math.floor(i / (ctx.sampleRate * 0.03))
    data[i] = chunk % 2 === 0 ? (Math.random() * 2 - 1) * 0.7 : (Math.random() * 2 - 1) * 0.15
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1600, ctx.currentTime)
  filter.Q.setValueAtTime(1.2, ctx.currentTime)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(mv * 0.45, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  noise.start(ctx.currentTime)
  noise.stop(ctx.currentTime + duration)
}

// System notification — gentle two-note chime, 300ms
function notification(ctx, mv) {
  ;[[880, 0], [1100, 0.15]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delay
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(mv * 0.35, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.12)
  })
}

// Keyboard click — very short tick, 30ms
function keyType(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(1200, ctx.currentTime)
  gain.gain.setValueAtTime(mv * 0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.03)
}

// BSOD crash — descending sweep + noise crash, 1 sec
function crash(ctx, mv) {
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(400, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.5)
  oscGain.gain.setValueAtTime(mv * 0.5, ctx.currentTime)
  oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
  osc.connect(oscGain)
  oscGain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.6)

  const bufSize = Math.floor(ctx.sampleRate * 0.4)
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  const nGain = ctx.createGain()
  nGain.gain.setValueAtTime(0.001, ctx.currentTime + 0.5)
  nGain.gain.linearRampToValueAtTime(mv * 0.4, ctx.currentTime + 0.6)
  nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0)
  noise.connect(nGain)
  nGain.connect(ctx.destination)
  noise.start(ctx.currentTime + 0.5)
  noise.stop(ctx.currentTime + 1.0)
}

// Win95-style startup chime — layered sine waves rising in pitch, ~2 sec
function boot(ctx, mv) {
  // Classic Win95 startup chord progression: D-E-A
  const notes = [
    { freq: 293.66, start: 0,    dur: 0.8, vol: 0.5 },  // D4
    { freq: 329.63, start: 0.4,  dur: 0.8, vol: 0.5 },  // E4
    { freq: 440.00, start: 0.8,  dur: 0.9, vol: 0.6 },  // A4
    { freq: 587.33, start: 1.0,  dur: 0.9, vol: 0.55 }, // D5
    { freq: 880.00, start: 1.3,  dur: 0.7, vol: 0.4 },  // A5 (harmonic)
  ]
  notes.forEach(({ freq, start, dur, vol }) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + start
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(mv * vol, t + 0.08)
    gain.gain.setValueAtTime(mv * vol, t + dur - 0.15)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  })
}

const retroPack = {
  boot,
  click,
  hover,
  select,
  error,
  success,
  modalOpen,
  modalClose,
  floppyRead,
  floppyWrite,
  notification,
  keyType,
  crash,
  // aliases for shared components that call these Digital-style names
  activate: hover,
  toggle: click,
  terminalOpen: modalOpen,
  terminalClose: modalClose,
  terminalKey: keyType,
  terminalSubmit: success,
}

soundManager.registerPack('retro', retroPack)

export default retroPack

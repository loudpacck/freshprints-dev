import { soundManager } from '../SoundManager'

// Warmer/lower synthesis throughout — triangle and sine over square

// Warm click — triangle at 500Hz, 35ms
function click(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(500, ctx.currentTime)
  gain.gain.setValueAtTime(mv * 0.35, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.035)
}

// Soft hover whisper — sine at 350Hz, 50ms
function hover(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(350, ctx.currentTime)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.1, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.05)
}

// Warm rising tone — sine sweep 300→700Hz, 200ms
function activate(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.2)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.25, ctx.currentTime + 0.07)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.2)
}

// Low descending whoosh — sine 600→150Hz, 350ms
function select(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.35)
  gain.gain.setValueAtTime(mv * 0.45, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.35)
}

// Warm modal swell — sine at 350Hz with low-pass, 220ms
function modalOpen(ctx, mv) {
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1500, ctx.currentTime)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(350, ctx.currentTime)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.22, ctx.currentTime + 0.09)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.22)
}

// Warm modal fade — sine at 280Hz, 130ms
function modalClose(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(280, ctx.currentTime)
  gain.gain.setValueAtTime(mv * 0.22, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.13)
}

// Success chord — 500Hz then 750Hz, 90ms each
function success(ctx, mv) {
  ;[[500, 0], [750, 0.1]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delay
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(mv * 0.4, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.09)
  })
}

// Low muted thud — sine 180→160Hz, 280ms
function error(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.1)
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(mv * 0.35, ctx.currentTime + 0.06)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.28)
}

// Soft toggle tick — triangle at 600Hz, 30ms
function toggle(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(600, ctx.currentTime)
  gain.gain.setValueAtTime(mv * 0.28, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.03)
}

// Subtle coin tinkle — triangle wave series at high pitches, 180ms
function purchase(ctx, mv) {
  ;[[1800, 0], [2200, 0.06], [1600, 0.12]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delay
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(mv * 0.28, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.08)
  })
}

// Small magical chime — ascending sine arpeggio, 280ms
function lootDrop(ctx, mv) {
  ;[[880, 0], [1100, 0.07], [1320, 0.14], [1760, 0.21]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delay
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(mv * 0.22, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  })
}

// File-backed SFX — new Audio() per call, no preload
function makeSfx(src, volMult) {
  return function(_ctx, mv) {
    const audio = new Audio(src)
    audio.volume = Math.min(1, mv * volMult)
    audio.play().catch(() => {})
  }
}

const pantheonPack = {
  // Core procedural sounds (13 Digital-named aliases — required so shared components don't warn)
  click,
  hover,
  activate,
  select,
  modalOpen,
  modalClose,
  success,
  error,
  toggle,
  terminalOpen:   modalOpen,
  terminalClose:  modalClose,
  terminalKey:    click,
  terminalSubmit: success,
  // Game-specific procedural sounds
  purchase,
  lootDrop,
  // Game-specific file-backed sounds (intro/ambience/alignmentChoose live in MusicManager/AmbienceManager)
  levelUp:       makeSfx('/sounds/pantheon_wars/levelUp.mp3',       0.8),
  combatWin:     makeSfx('/sounds/pantheon_wars/combatWin.mp3',     0.7),
  combatLose:    makeSfx('/sounds/pantheon_wars/combatLose.mp3',    0.7),
  questComplete: makeSfx('/sounds/pantheon_wars/questComplete.mp3', 0.6),
  templeUpgrade: makeSfx('/sounds/pantheon_wars/temple_upgrade.mp3', 0.6),
}

soundManager.registerPack('pantheon', pantheonPack)

export default pantheonPack

import { soundManager } from '../SoundManager'

// Warmer/lower synthesis throughout — triangle and sine over square

// Warm click — triangle at 500Hz, 35ms
function click(ctx, mv) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(500, ctx.currentTime)
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.35)), ctx.currentTime)
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
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.1)), ctx.currentTime + 0.02)
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
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.25)), ctx.currentTime + 0.07)
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
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.45)), ctx.currentTime)
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
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.22)), ctx.currentTime + 0.09)
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
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.22)), ctx.currentTime)
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
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.4)), t)
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
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.35)), ctx.currentTime + 0.06)
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
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.28)), ctx.currentTime)
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
    gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.28)), t + 0.01)
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
    gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.22)), t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  })
}

// ─── Combat SFX ───────────────────────────────────────────────────────────────

// Short high-pitched ting — non-crit sword strike, 80ms
function swordHit(ctx, mv) {
  const t = ctx.currentTime
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(1000, t)
  osc1.frequency.exponentialRampToValueAtTime(700, t + 0.08)
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(1200, t)
  osc2.detune.setValueAtTime(10, t)
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.3)), t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)
  osc1.start(t); osc1.stop(t + 0.08)
  osc2.start(t); osc2.stop(t + 0.08)
}

// Sawtooth + noise burst — critical sword strike, 200ms
function swordCrit(ctx, mv) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(1000, t)
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.2)
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.28)), t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t); osc.stop(t + 0.2)
  // Noise burst overlay
  try {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    const nf = ctx.createBiquadFilter()
    const ng = ctx.createGain()
    nf.type = 'bandpass'
    nf.frequency.setValueAtTime(3000, t)
    nf.Q.setValueAtTime(0.5, t)
    ng.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.2)), t)
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    src.buffer = buf
    src.connect(nf)
    nf.connect(ng)
    ng.connect(ctx.destination)
    src.start(t)
  } catch { /* noise buffer optional */ }
}

// Lower metallic clang — shield block, 250ms
function shieldBlock(ctx, mv) {
  const t = ctx.currentTime
  ;[[400, 'square'], [600, 'triangle']].forEach(([freq, type]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.35)), t)
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.35)), t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t); osc.stop(t + 0.25)
  })
}

// White noise bandpass sweep high→low — dodge, 150ms
function dodge(ctx, mv) {
  const t = ctx.currentTime
  const dur = 0.15
  try {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(3000, t)
    filter.frequency.exponentialRampToValueAtTime(400, t + dur)
    filter.Q.setValueAtTime(1.5, t)
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.3)), t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.buffer = buf
    src.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    src.start(t)
  } catch { /* noise buffer optional */ }
}

// Sawtooth pitch sweep 200→600Hz — sword unsheath, 200ms
function attackInitiate(ctx, mv) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(200, t)
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.2)
  gain.gain.setValueAtTime(0.001, t)
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.22)), t + 0.08)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t); osc.stop(t + 0.2)
}

// Subtle bell — round begin, sine 440Hz, 300ms
function roundBegin(ctx, mv) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, t)
  gain.gain.setValueAtTime(0.001, t)
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.15)), t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t); osc.stop(t + 0.3)
}

// Sine + sawtooth 110Hz with vibrato — mythological horn, 1.2s
function titanHorn(ctx, mv) {
  const t = ctx.currentTime
  const dur = 1.2
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(110, t)
  osc2.type = 'sawtooth'
  osc2.frequency.setValueAtTime(110, t)
  lfo.frequency.setValueAtTime(5, t)
  lfoGain.gain.setValueAtTime(3, t)
  lfo.connect(lfoGain)
  lfoGain.connect(osc1.frequency)
  lfoGain.connect(osc2.frequency)
  gain.gain.setValueAtTime(0.001, t)
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.45)), t + 0.15)
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.45)), t + dur - 0.3)
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)
  lfo.start(t); lfo.stop(t + dur)
  osc1.start(t); osc1.stop(t + dur)
  osc2.start(t); osc2.stop(t + dur)
}

// Low square wave 80Hz pitch-down — township/temple establish, 300ms
function templeFoundation(ctx, mv) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(80, t)
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.3)
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.5)), t)
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, mv * 0.5)), t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t); osc.stop(t + 0.3)
}

// Ascending C5-E5-G5 arpeggio — upgrade complete, 380ms
function upgradeComplete(ctx, mv) {
  ;[[523.25, 0], [659.25, 0.1], [783.99, 0.2]].forEach(([freq, delay]) => {
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.35)), t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t); osc.stop(t + 0.2)
  })
}

// Triangle 800Hz + 1200Hz overtone — equip item, 150ms
function equipItem(ctx, mv) {
  const t = ctx.currentTime
  ;[[800, 0], [1200, 0.03]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t + delay)
    gain.gain.setValueAtTime(0.001, t + delay)
    gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.3)), t + delay + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t + delay); osc.stop(t + delay + 0.15)
  })
}

// Triangle descending 800→600Hz — unequip item, 150ms
function unequipItem(ctx, mv) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(800, t)
  osc.frequency.linearRampToValueAtTime(600, t + 0.15)
  gain.gain.setValueAtTime(0.001, t)
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.28)), t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t); osc.stop(t + 0.15)
}

// Gentle two-tone chime 600Hz then 900Hz — proactive toast appear, 180ms
function notification(ctx, mv) {
  ;[[600, 0], [900, 0.09]].forEach(([freq, delay]) => {
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, mv * 0.2)), t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t); osc.stop(t + 0.08)
  })
}

// ─── File-backed SFX — cached singleton per sound key ─────────────────────────

function makeSfx(src, volMult) {
  let cached = null
  const play = function(_ctx, mv) {
    if (!cached) {
      cached = new Audio(src)
      cached.preload = 'auto'
    }
    try {
      cached.currentTime = 0
      cached.volume = Math.max(0, Math.min(1, mv * volMult))
      cached.play().catch(() => {})
    } catch {
      const fresh = new Audio(src)
      fresh.volume = Math.max(0, Math.min(1, mv * volMult))
      fresh.play().catch(() => {})
    }
  }
  play.preloadUrl = src
  return play
}

const pantheonPack = {
  // Core procedural sounds (Digital-named aliases — required so shared components don't warn)
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
  // General game sounds
  purchase,
  lootDrop,
  notification,
  // Combat SFX
  swordHit,
  swordCrit,
  shieldBlock,
  dodge,
  attackInitiate,
  roundBegin,
  // Mythological / environment
  titanHorn,
  templeFoundation,
  upgradeComplete,
  // Inventory
  equipItem,
  unequipItem,
  // Game-specific file-backed sounds (intro/ambience/alignmentChoose live in MusicManager/AmbienceManager)
  levelUp:       makeSfx('/sounds/pantheon_wars/levelUp.mp3',       0.8),
  combatWin:     makeSfx('/sounds/pantheon_wars/combatWin.mp3',     0.7),
  combatLose:    makeSfx('/sounds/pantheon_wars/combatLose.mp3',    0.7),
  questComplete: makeSfx('/sounds/pantheon_wars/questComplete.mp3', 0.6),
  templeUpgrade:     makeSfx('/sounds/pantheon_wars/temple_upgrade.mp3', 0.6),
  adventureComplete: success,
}

soundManager.registerPack('pantheon', pantheonPack)

export default pantheonPack

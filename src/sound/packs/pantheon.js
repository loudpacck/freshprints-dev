import { soundManager } from '../SoundManager'

// ─── Procedural UI sounds (warm synth — kept from Phase B) ───────────────────

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

// ─── File-backed SFX — cached singleton per sound key ─────────────────────────

function makeSfx(src, volMult = 1) {
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
  // ── Procedural UI (shared components use these keys) ──
  click,
  hover,
  activate,
  select,
  modalOpen,
  modalClose,
  success,
  toggle,
  terminalOpen:   modalOpen,
  terminalClose:  modalClose,
  terminalKey:    click,
  terminalSubmit: success,

  // ── Combat ──
  sword_hit:        makeSfx('/sounds/pantheon_wars/sword_hit.mp3'),
  sword_crit:       makeSfx('/sounds/pantheon_wars/sword_crit.mp3'),
  shield_block:     makeSfx('/sounds/pantheon_wars/shield_block.mp3'),
  dodge:            makeSfx('/sounds/pantheon_wars/dodge.mp3'),
  attack_initiate:  makeSfx('/sounds/pantheon_wars/attack_initiate.mp3'),

  // ── Township & Temples ──
  township_establish: makeSfx('/sounds/pantheon_wars/township_establish.mp3'),
  upgrade_complete:   makeSfx('/sounds/pantheon_wars/upgrade_complete.mp3'),
  temple_buy:         makeSfx('/sounds/pantheon_wars/temple_buy.mp3'),

  // ── Titan ──
  titan_horn:       makeSfx('/sounds/pantheon_wars/titan_horn.mp3'),
  titan_appears:    makeSfx('/sounds/pantheon_wars/titan_appears.mp3'),
  titan_defeated:   makeSfx('/sounds/pantheon_wars/titan_defeated.mp3'),

  // ── Inventory & Items ──
  equip_item:       makeSfx('/sounds/pantheon_wars/equip_item.mp3'),
  unequip_item:     makeSfx('/sounds/pantheon_wars/unequip_item.mp3'),
  loot_drop:        makeSfx('/sounds/pantheon_wars/loot_drop.mp3'),
  rare_loot:        makeSfx('/sounds/pantheon_wars/rare_loot.mp3'),

  // ── Economy ──
  purchase:           makeSfx('/sounds/pantheon_wars/purchase.mp3'),
  sell_item:          makeSfx('/sounds/pantheon_wars/sell_item.mp3'),
  insufficient_funds: makeSfx('/sounds/pantheon_wars/insufficient_funds.mp3'),

  // ── UI ──
  toast_notification: makeSfx('/sounds/pantheon_wars/toast_notification.mp3'),
  error:              makeSfx('/sounds/pantheon_wars/error.mp3'),

  // ── Quests & Adventures ──
  adventure_depart: makeSfx('/sounds/pantheon_wars/adventure_depart.mp3'),
  adventure_return: makeSfx('/sounds/pantheon_wars/adventure_return.mp3'),
  quest_accept:     makeSfx('/sounds/pantheon_wars/quest_accept.mp3'),

  // ── Misc ──
  stat_allocate: makeSfx('/sounds/pantheon_wars/stat_allocate.mp3'),

  // ── Pre-existing file-backed sounds ──
  levelUp:       makeSfx('/sounds/pantheon_wars/levelUp.mp3',       0.8),
  combatWin:     makeSfx('/sounds/pantheon_wars/combatWin.mp3',     0.7),
  combatLose:    makeSfx('/sounds/pantheon_wars/combatLose.mp3',    0.7),
  questComplete: makeSfx('/sounds/pantheon_wars/questComplete.mp3', 0.6),
  templeUpgrade: makeSfx('/sounds/pantheon_wars/temple_upgrade.mp3', 0.6),

  // ── Legacy aliases (backward compat for any lingering call sites) ──
  lootDrop:         makeSfx('/sounds/pantheon_wars/loot_drop.mp3'),
  adventureComplete: makeSfx('/sounds/pantheon_wars/adventure_return.mp3'),
}

soundManager.registerPack('pantheon', pantheonPack)

export default pantheonPack

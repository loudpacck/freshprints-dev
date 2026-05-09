class SoundManager {
  constructor() {
    this.ctx = null
    this.muted = this._loadMuted()
    this.masterVolume = 0.3
    this.activePack = 'digital'
    this.packs = {}
  }

  registerPack(name, pack) {
    this.packs[name] = pack
  }

  setPack(name) {
    this.activePack = name
  }

  _ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return null
      this.ctx = new Ctx()
    }
    return this.ctx
  }

  _prefersReducedMotion() {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  play(name) {
    if (this.muted || this._prefersReducedMotion()) return
    const pack = this.packs[this.activePack]
    if (!pack) return
    const gen = pack[name]
    if (!gen) {
      console.warn(`[sound] missing sound: "${name}" in pack "${this.activePack}"`)
      return
    }
    const ctx = this._ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    try {
      gen(ctx, this.masterVolume)
    } catch (e) {
      console.warn('[sound] error playing:', name, e)
    }
  }

  toggleMute() {
    this.muted = !this.muted
    this._saveMuted()
    return this.muted
  }

  setMuted(v) {
    this.muted = !!v
    this._saveMuted()
  }

  getMuted() {
    return this.muted
  }

  _loadMuted() {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem('fp-sound-muted') === 'true'
  }

  _saveMuted() {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem('fp-sound-muted', String(this.muted))
  }
}

export const soundManager = new SoundManager()

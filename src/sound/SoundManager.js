class SoundManager {
  constructor() {
    this.ctx = null
    this.activeThemeId = 'digital'
    this.muted = this._loadMutedForTheme('digital')
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

  // Called by ThemeProvider when theme changes — loads per-theme mute preference
  setActiveTheme(id) {
    this.activeThemeId = id
    this.muted = this._loadMutedForTheme(id)
    this._emitStateChange()
  }

  _muteKey(id) {
    if (id === 'retro')    return 'fp-sound-muted-retro'
    if (id === 'digital')  return 'fp-sound-muted-digital'
    if (id === 'pantheon') return 'fp-sound-muted-pantheon'
    return 'fp-sound-muted'
  }

  _defaultMuted(id) {
    // Retro and Pantheon default to unmuted — sound is part of the experience
    if (id === 'retro')    return false
    if (id === 'pantheon') return false
    return true
  }

  _loadMutedForTheme(id) {
    if (typeof localStorage === 'undefined') return this._defaultMuted(id)
    const stored = localStorage.getItem(this._muteKey(id))
    if (stored === null) return this._defaultMuted(id)
    return stored === 'true'
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

  _emitStateChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fp-sound-state-change', { detail: { muted: this.muted } }))
    }
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

  playAtVolume(name, scale) {
    if (this.muted || this._prefersReducedMotion()) return
    const pack = this.packs[this.activePack]
    if (!pack) return
    const gen = pack[name]
    if (!gen) return
    const ctx = this._ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    try {
      gen(ctx, this.masterVolume * Math.max(0, Math.min(1, scale)))
    } catch (e) {
      console.warn('[sound] error playing:', name, e)
    }
  }

  preloadPack(packName) {
    const pack = this.packs[packName]
    if (!pack) return
    for (const key of Object.keys(pack)) {
      const entry = pack[key]
      if (entry?.preloadUrl) {
        const audio = new Audio(entry.preloadUrl)
        audio.preload = 'auto'
      }
    }
  }

  toggleMute() {
    this.muted = !this.muted
    this._saveMuted()
    this._emitStateChange()
    return this.muted
  }

  setMuted(v) {
    this.muted = !!v
    this._saveMuted()
    this._emitStateChange()
  }

  getMuted() {
    return this.muted
  }

  _saveMuted() {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(this._muteKey(this.activeThemeId), String(this.muted))
  }

  // Legacy single key — kept for backwards compat
  _loadMuted() {
    return this._loadMutedForTheme(this.activeThemeId || 'digital')
  }
}

export const soundManager = new SoundManager()

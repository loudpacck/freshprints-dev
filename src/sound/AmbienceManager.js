// Handles the looping background ambience track.
// Listens to fp-music-playback-change: pauses when music starts, resumes when music ends.
// Mute state persisted under fp-ambience-muted-pantheon.

class AmbienceManager {
  constructor() {
    this._audio = null
    this._src = null
    this._muted = this._loadMuted()
    // Tracks whether ambience should (re)start when music ends
    this._pendingResume = false

    if (typeof window !== 'undefined') {
      window.addEventListener('fp-music-playback-change', (e) => {
        if (e.detail.playing) {
          // Music started — pause ambience if playing, mark for auto-resume
          if (this._src) this._pendingResume = true
          if (this._audio && !this._audio.paused) {
            this._audio.pause()
          }
        } else {
          // Music ended/stopped — resume if we have a src and the flag is set
          if (this._pendingResume && this._src && !this._muted) {
            this._pendingResume = false
            this._playInternal()
          }
        }
      })
    }
  }

  _loadMuted() {
    if (typeof localStorage === 'undefined') return false
    const v = localStorage.getItem('fp-ambience-muted-pantheon')
    return v === 'true'
  }

  _saveMuted() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fp-ambience-muted-pantheon', String(this._muted))
    }
  }

  _emitStateChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fp-ambience-state-change', { detail: { muted: this._muted } }))
    }
  }

  _ensureAudio(src) {
    if (!this._audio || this._audio.src !== new URL(src, location.origin).href) {
      if (this._audio) this._audio.pause()
      this._audio = new Audio(src)
      this._audio.loop = true
      this._audio.volume = this._muted ? 0 : 0.25
    }
  }

  _playInternal() {
    if (!this._src) return
    this._ensureAudio(this._src)
    if (this._audio.paused) {
      this._audio.play().catch(() => {})
    }
  }

  // Arm ambience src without playing — used when the intro song will trigger the start via event chain.
  setSrc(src) {
    this._src = src
    this._ensureAudio(src)
  }

  // Start looping ambience. Idempotent if already playing same src.
  play(src) {
    this._src = src
    this._ensureAudio(src)
    if (!this._muted && this._audio.paused) {
      this._audio.play().catch(() => {})
    }
  }

  pause() {
    if (this._audio && !this._audio.paused) {
      this._audio.pause()
    }
  }

  resume() {
    if (this._src && !this._muted) {
      this._playInternal()
    }
  }

  stop() {
    if (this._audio) {
      this._audio.pause()
      this._audio.currentTime = 0
      this._audio = null
    }
    this._src = null
    this._pendingResume = false
  }

  setVolume(v) {
    if (this._audio) this._audio.volume = v
  }

  isMuted() { return this._muted }

  toggleMute() {
    this._muted = !this._muted
    this._saveMuted()
    if (this._muted) {
      this.pause()
    } else if (this._src) {
      this._playInternal()
    }
    this._emitStateChange()
    return this._muted
  }
}

export const ambienceManager = new AmbienceManager()

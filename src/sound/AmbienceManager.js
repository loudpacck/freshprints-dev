// Handles the looping background ambience track.
// Listens to fp-music-playback-change: pauses when music starts, resumes when music ends.
// Mute state persisted under fp-ambience-muted-pantheon.

class AmbienceManager {
  constructor() {
    this._audio = null
    this._src = null
    this._muted = this._loadMuted()
    this._pendingResume = false
    this._musicPlaying = false // tracks live state of MusicManager via events

    if (typeof window !== 'undefined') {
      window.addEventListener('fp-music-playback-change', (e) => {
        this._musicPlaying = e.detail.playing
        if (e.detail.playing) {
          // Music started — arm resume flag and silence ambience if running
          if (this._src) this._pendingResume = true
          if (this._audio && !this._audio.paused) {
            this._audio.pause()
          }
        } else {
          // Music ended/stopped — start ambience if armed
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
      this._audio.volume = this._muted ? 0 : 0.125
    }
  }

  _fadeIn(durationMs = 2000) {
    if (!this._audio) return
    const target = this._muted ? 0 : 0.125
    this._audio.volume = 0
    const startTime = performance.now()
    const tick = (now) => {
      if (!this._audio) return
      const progress = Math.min((now - startTime) / durationMs, 1)
      this._audio.volume = target * progress
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  _playInternal() {
    if (!this._src) return
    this._ensureAudio(this._src)
    if (this._audio.paused) {
      this._audio.play().catch(() => {})
      this._fadeIn()
    }
  }

  // Called once on first user interaction if autoplay was blocked on initial play().
  _setupInteractionRetry() {
    const retry = () => {
      if (this._src && !this._muted && !this._musicPlaying) {
        this._playInternal()
      }
    }
    window.addEventListener('click',   retry, { once: true })
    window.addEventListener('keydown', retry, { once: true })
    window.addEventListener('touchend', retry, { once: true })
  }

  // Start looping ambience. Safe to call any time — handles all edge cases:
  //   - music currently playing → arms _pendingResume instead of starting
  //   - autoplay blocked → registers one-time interaction retry
  //   - already playing same src → no-op
  play(src) {
    this._src = src
    this._ensureAudio(src)

    if (this._musicPlaying) {
      // Music is active — arm resume so ambience starts when music ends
      this._pendingResume = true
      return
    }

    if (!this._muted && this._audio.paused) {
      this._audio.play().catch(err => {
        // Autoplay blocked by browser policy — retry on first interaction
        if (err && err.name === 'NotAllowedError') {
          this._setupInteractionRetry()
        }
      })
      this._fadeIn()
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
      // Silence in-place
      if (this._audio) this._audio.volume = 0
    } else {
      if (this._audio && !this._audio.paused) {
        // Audio was running silently; restore volume
        this._audio.volume = 0.125
      } else if (this._src && !this._musicPlaying) {
        // Audio was stopped or blocked; start it now (user gesture present)
        this._playInternal()
      } else if (this._src && this._musicPlaying) {
        // Music is playing; arm resume for when it ends
        this._pendingResume = true
      }
    }
    this._emitStateChange()
    return this._muted
  }
}

export const ambienceManager = new AmbienceManager()

// Handles the looping background ambience track.
// Listens to fp-music-playback-change: fades out when music starts, resumes when music ends.
// Mute state persisted under fp-ambience-muted-pantheon.

class AmbienceManager {
  constructor() {
    this._audio = null
    this._src = null
    this._muted = this._loadMuted()
    this._pendingResume = false
    this._musicPlaying = false
    this._retryCleanup = null  // cancels any pending interaction-retry listeners

    if (typeof window !== 'undefined') {
      window.addEventListener('fp-music-playback-change', (e) => {
        this._musicPlaying = e.detail.playing
        if (e.detail.playing) {
          // Music started — fade out ambience and arm resume
          if (this._src) this._pendingResume = true
          if (this._audio && !this._audio.paused) {
            this._fadeOut(800)
          }
        } else {
          // Music ended/stopped — resume ambience if armed
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

  _fadeOut(durationMs = 800) {
    if (!this._audio) return
    const startVol = this._audio.volume
    const startTime = performance.now()
    const audio = this._audio  // capture ref so async tick doesn't use a replaced element
    const tick = (now) => {
      if (this._audio !== audio) return  // element was replaced — stop
      const progress = Math.min((now - startTime) / durationMs, 1)
      audio.volume = startVol * (1 - progress)
      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        audio.pause()
        audio.volume = 0.125  // reset for when it resumes
      }
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

  _cancelRetry() {
    if (this._retryCleanup) {
      this._retryCleanup()
      this._retryCleanup = null
    }
  }

  _setupInteractionRetry() {
    this._cancelRetry()
    const retry = () => {
      this._retryCleanup = null
      if (this._src && !this._muted && !this._musicPlaying) {
        this._playInternal()
      }
    }
    window.addEventListener('click',    retry, { once: true })
    window.addEventListener('keydown',  retry, { once: true })
    window.addEventListener('touchend', retry, { once: true })
    this._retryCleanup = () => {
      window.removeEventListener('click',    retry)
      window.removeEventListener('keydown',  retry)
      window.removeEventListener('touchend', retry)
    }
  }

  // Start looping ambience. Handles all edge cases:
  //   - music currently playing → arms _pendingResume instead of starting
  //   - autoplay blocked → registers one-time interaction retry
  //   - already playing same src → no-op
  play(src) {
    this._src = src
    this._ensureAudio(src)

    if (this._musicPlaying) {
      this._pendingResume = true
      return
    }

    if (!this._muted && this._audio.paused) {
      this._audio.play().catch(err => {
        if (err && err.name === 'NotAllowedError') {
          this._setupInteractionRetry()
        }
      })
      this._fadeIn()
    }
  }

  pause() {
    this._cancelRetry()
    if (this._audio && !this._audio.paused) {
      this._audio.pause()
    }
  }

  resume() {
    if (this._src && !this._muted) {
      this._playInternal()
    }
  }

  // Full stop — clears src and cancels all pending state. Call when leaving the game.
  stop() {
    this._cancelRetry()
    this._pendingResume = false
    if (this._audio) {
      this._audio.pause()
      this._audio.currentTime = 0
      this._audio = null
    }
    this._src = null
  }

  setVolume(v) {
    if (this._audio) this._audio.volume = v
  }

  isMuted() { return this._muted }

  toggleMute() {
    this._muted = !this._muted
    this._saveMuted()
    if (this._muted) {
      this._cancelRetry()
      if (this._audio) this._audio.volume = 0
    } else {
      if (this._audio && !this._audio.paused) {
        this._audio.volume = 0.125
      } else if (this._src && !this._musicPlaying) {
        this._playInternal()
      } else if (this._src && this._musicPlaying) {
        this._pendingResume = true
      }
    }
    this._emitStateChange()
    return this._muted
  }
}

export const ambienceManager = new AmbienceManager()

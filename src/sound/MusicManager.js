// Handles one-shot music cues (intro song, alignment song).
// Separate from SFX (SoundManager) and looping ambience (AmbienceManager).
// Mute state persisted under fp-music-muted-pantheon.

class MusicManager {
  constructor() {
    this._audio = null
    this._active = false  // logically active while a track is loaded (even if paused-muted)
    this._muted = this._loadMuted()
  }

  _loadMuted() {
    if (typeof localStorage === 'undefined') return false
    const v = localStorage.getItem('fp-music-muted-pantheon')
    return v === 'true'
  }

  _saveMuted() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fp-music-muted-pantheon', String(this._muted))
    }
  }

  _emitStateChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fp-music-state-change', { detail: { muted: this._muted } }))
    }
  }

  // Emitting { playing: false } is what triggers AmbienceManager to resume.
  // Do NOT emit this on mute-pause — only on natural end or explicit stop().
  _emitPlaybackChange(playing) {
    this._active = playing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fp-music-playback-change', { detail: { playing } }))
    }
  }

  _clearAudio() {
    if (this._audio) {
      this._audio.pause()
      this._audio = null
    }
  }

  // Play a one-shot music cue. Stops any current track first.
  // If muted, audio plays silently (volume 0) so the ended event still fires
  // and the MusicManager → AmbienceManager timing chain is preserved.
  play(src, { onEnded } = {}) {
    if (this._active) {
      this._clearAudio()
      this._emitPlaybackChange(false)
    }

    const audio = new Audio(src)
    audio.volume = this._muted ? 0 : 0.6
    this._audio = audio

    audio.addEventListener('ended', () => {
      this._audio = null
      if (onEnded) onEnded()
      this._emitPlaybackChange(false)
    }, { once: true })

    audio.play().catch(() => {})
    this._emitPlaybackChange(true)
    return audio
  }

  pause() {
    if (this._audio && !this._audio.paused) {
      this._audio.pause()
    }
  }

  resume() {
    if (this._audio && this._audio.paused && !this._audio.ended && !this._muted) {
      this._audio.play().catch(() => {})
    }
  }

  // Fully stop and clear. Fires playback-change { playing: false } → ambience resumes.
  stop() {
    if (this._active) {
      this._clearAudio()
      this._emitPlaybackChange(false)
    }
  }

  setVolume(v) {
    if (this._audio) this._audio.volume = v
  }

  isMuted() { return this._muted }
  isPlaying() { return this._active }

  toggleMute() {
    this._muted = !this._muted
    this._saveMuted()
    if (this._audio) {
      if (this._muted) {
        // Pause audio; do NOT emit playback-change — ambience should not resume while music is just muted
        this._audio.pause()
      } else {
        // Unmuting: resume from paused position
        if (this._audio.paused && !this._audio.ended) {
          this._audio.play().catch(() => {})
        }
      }
    }
    this._emitStateChange()
    return this._muted
  }
}

export const musicManager = new MusicManager()

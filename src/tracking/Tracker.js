import { getSessionId, getVisitorId, dntEnabled } from './sessionUtils'

const BUFFER_MAX = 20
const FLUSH_INTERVAL_MS = 5000

class Tracker {
  constructor() {
    this.buffer = []
    this.flushTimer = null
    this.context = { uiTheme: 'digital', uiMode: 'dark' }
    this.disabled = dntEnabled()
    this._setupAutoFlush()
  }

  setContext({ uiTheme, uiMode }) {
    if (uiTheme) this.context.uiTheme = uiTheme
    if (uiMode) this.context.uiMode = uiMode
  }

  track(type, data = {}) {
    if (this.disabled) return
    this.buffer.push({ type, data, ts: Date.now() })
    if (this.buffer.length >= BUFFER_MAX) this.flush()
  }

  async flush() {
    if (this.disabled) return
    if (this.buffer.length === 0) return
    const events = this.buffer.splice(0, this.buffer.length)
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          sessionId: getSessionId(),
          visitorId: getVisitorId(),
          path: window.location.pathname,
          uiTheme: this.context.uiTheme,
          uiMode: this.context.uiMode,
        }),
        keepalive: true,
      })
    } catch {
      if (this.buffer.length < 200) this.buffer.unshift(...events)
    }
  }

  _setupAutoFlush() {
    if (this.disabled) return
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS)
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.flush())
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flush()
      })
    }
  }
}

export const tracker = new Tracker()

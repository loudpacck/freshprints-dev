const VISITOR_KEY = 'fp_visitor'
const SESSION_KEY = 'fp_session'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

function uuid() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

export function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) { id = uuid(); localStorage.setItem(VISITOR_KEY, id) }
  return id
}

export function getSessionId() {
  const stored = sessionStorage.getItem(SESSION_KEY)
  const lastActivity = Number(sessionStorage.getItem(SESSION_KEY + '_ts') || 0)
  const now = Date.now()
  if (stored && now - lastActivity < SESSION_TIMEOUT_MS) {
    sessionStorage.setItem(SESSION_KEY + '_ts', String(now))
    return stored
  }
  const id = uuid()
  sessionStorage.setItem(SESSION_KEY, id)
  sessionStorage.setItem(SESSION_KEY + '_ts', String(now))
  return id
}

export function dntEnabled() {
  return navigator.doNotTrack === '1' || window.doNotTrack === '1'
}

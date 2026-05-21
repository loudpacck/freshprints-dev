import bcrypt from 'bcryptjs'
import { sql } from './db.js'
import { validateModeratorSession } from './modAuth.js'

const SESSION_COOKIE_NAME = 'pw_session'
const SESSION_DAYS = 7
const BCRYPT_ROUNDS = 12

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export async function createUserSession(userId, res) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const rows = await sql`
    INSERT INTO pw_user_sessions (user_id, expires_at)
    VALUES (${userId}, ${expiresAt.toISOString()})
    RETURNING id
  `
  const sessionId = rows[0].id
  res.setHeader('Set-Cookie', buildSessionCookie(sessionId, expiresAt))
  return { sessionId, expiresAt }
}

export async function validateUserSession(req) {
  const sessionId = getSessionFromCookie(req)
  if (!sessionId) return null
  const rows = await sql`
    SELECT user_id FROM pw_user_sessions
    WHERE id = ${sessionId} AND expires_at > NOW()
  `
  return rows.length > 0 ? rows[0].user_id : null
}

export async function revokeUserSession(sessionId) {
  if (!sessionId) return
  await sql`DELETE FROM pw_user_sessions WHERE id = ${sessionId}`
}

export function requireUser(handler) {
  return async (req, res) => {
    const userId = await validateUserSession(req)
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    req.userId = userId
    return handler(req, res)
  }
}

export function requireUserWithModCheck(handler) {
  return async (req, res) => {
    const userId = await validateUserSession(req)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    req.userId = userId

    try {
      const modSession = await validateModeratorSession(req)
      if (modSession) {
        req.modId = modSession.moderatorId
        req.modUsername = modSession.username
        const modRows = await sql`SELECT show_chat_badge FROM pw_moderators WHERE id = ${modSession.moderatorId}`
        req.modShowBadge = modRows[0]?.show_chat_badge ?? true
      } else {
        req.modId = null
        req.modUsername = null
        req.modShowBadge = false
      }
    } catch {
      req.modId = null
      req.modUsername = null
      req.modShowBadge = false
    }

    return handler(req, res)
  }
}

export function getSessionFromCookie(req) {
  const cookies = parseCookies(req.headers.cookie || '')
  return cookies[SESSION_COOKIE_NAME] || null
}

export function buildSessionCookie(sessionId, expiresAt) {
  const expires = expiresAt.toUTCString()
  return `${SESSION_COOKIE_NAME}=${sessionId}; Expires=${expires}; HttpOnly; Secure; SameSite=Strict; Path=/`
}

export function buildClearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Max-Age=0; HttpOnly; Secure; SameSite=Strict; Path=/`
}

function parseCookies(str) {
  const out = {}
  str.split(';').forEach(pair => {
    const [k, v] = pair.trim().split('=')
    if (k) out[k] = decodeURIComponent(v || '')
  })
  return out
}

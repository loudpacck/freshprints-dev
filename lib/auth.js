import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { sql } from './db.js'

const SESSION_COOKIE_NAME = 'fp_admin'
const SESSION_DAYS = 7

export async function verifyAdminPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) return false
  return bcrypt.compare(password, hash)
}

export async function createAdminSession(req) {
  const id = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || null
  const ua = req.headers['user-agent'] || null
  await sql`
    INSERT INTO admin_sessions (id, expires_at, ip_address, user_agent)
    VALUES (${id}, ${expiresAt.toISOString()}, ${ip}, ${ua})
  `
  return { id, expiresAt }
}

export async function validateAdminSession(sessionId) {
  if (!sessionId) return false
  const rows = await sql`
    SELECT id FROM admin_sessions
    WHERE id = ${sessionId} AND expires_at > NOW()
  `
  return rows.length > 0
}

export async function revokeAdminSession(sessionId) {
  if (!sessionId) return
  await sql`DELETE FROM admin_sessions WHERE id = ${sessionId}`
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

export async function requireAdmin(req, res) {
  const sessionId = getSessionFromCookie(req)
  const valid = await validateAdminSession(sessionId)
  if (!valid) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}

import { sql } from './db.js'

const SESSION_COOKIE_NAME = 'fp_mod'
const SESSION_DAYS = 7

export async function createModeratorSession(moderatorId, res) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const rows = await sql`
    INSERT INTO pw_moderator_sessions (moderator_id, expires_at)
    VALUES (${moderatorId}, ${expiresAt.toISOString()})
    RETURNING id
  `
  const sessionId = rows[0].id
  res.setHeader('Set-Cookie', buildModSessionCookie(sessionId, expiresAt))
  return { sessionId, expiresAt }
}

export async function validateModeratorSession(req) {
  const sessionId = getModSessionFromCookie(req)
  if (!sessionId) return null
  const rows = await sql`
    SELECT m.id AS moderator_id, m.username
    FROM pw_moderator_sessions s
    JOIN pw_moderators m ON m.id = s.moderator_id
    WHERE s.id = ${sessionId}
      AND s.expires_at > NOW()
      AND m.is_active = TRUE
  `
  return rows.length > 0
    ? { moderatorId: rows[0].moderator_id, username: rows[0].username }
    : null
}

export async function revokeModeratorSession(sessionId) {
  if (!sessionId) return
  await sql`DELETE FROM pw_moderator_sessions WHERE id = ${sessionId}`
}

export async function requireModerator(req, res) {
  const mod = await validateModeratorSession(req)
  if (!mod) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return mod
}

export function getModSessionFromCookie(req) {
  const cookies = parseCookies(req.headers.cookie || '')
  return cookies[SESSION_COOKIE_NAME] || null
}

export function buildModSessionCookie(sessionId, expiresAt) {
  const expires = expiresAt.toUTCString()
  return `${SESSION_COOKIE_NAME}=${sessionId}; Expires=${expires}; HttpOnly; Secure; SameSite=Strict; Path=/`
}

export function buildClearModSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Max-Age=0; HttpOnly; Secure; SameSite=Strict; Path=/`
}

export async function logModAction(sqlClient, moderatorId, username, actionType, actionData) {
  await sqlClient`
    INSERT INTO pw_moderator_actions (moderator_id, moderator_username, action_type, action_data)
    VALUES (${moderatorId}, ${username}, ${actionType}, ${JSON.stringify(actionData)})
  `
}

function parseCookies(str) {
  const out = {}
  str.split(';').forEach(pair => {
    const [k, v] = pair.trim().split('=')
    if (k) out[k.trim()] = decodeURIComponent(v || '')
  })
  return out
}

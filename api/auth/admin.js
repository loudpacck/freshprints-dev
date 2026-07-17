import {
  verifyAdminPassword,
  createAdminSession,
  buildSessionCookie,
  getSessionFromCookie,
  validateAdminSession,
  revokeAdminSession,
  buildClearSessionCookie,
} from '../../lib/auth.js'

export const config = { runtime: 'nodejs' }

// Consolidated admin auth (Phase D1): login | check | logout via ?action=.
// Bare POST with no action defaults to login (drop-in for the original login URL).
export default async function handler(req, res) {
  const action = req.query.action || (req.method === 'POST' ? 'login' : null)
  if (action === 'login')  return handleLogin(req, res)
  if (action === 'check')  return handleCheck(req, res)
  if (action === 'logout') return handleLogout(req, res)
  return res.status(400).json({ error: 'Unknown action' })
}

async function handleLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Missing password' })

  const ok = await verifyAdminPassword(password)
  if (!ok) {
    await new Promise(r => setTimeout(r, 800))
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const { id, expiresAt } = await createAdminSession(req)
  res.setHeader('Set-Cookie', buildSessionCookie(id, expiresAt))
  return res.status(200).json({ ok: true })
}

async function handleCheck(req, res) {
  const sessionId = getSessionFromCookie(req)
  const valid = await validateAdminSession(sessionId)
  return res.status(200).json({ authenticated: valid })
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const sessionId = getSessionFromCookie(req)
  await revokeAdminSession(sessionId)
  res.setHeader('Set-Cookie', buildClearSessionCookie())
  return res.status(200).json({ ok: true })
}

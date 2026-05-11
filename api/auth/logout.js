import { getSessionFromCookie, revokeAdminSession, buildClearSessionCookie } from '../../lib/auth.js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const sessionId = getSessionFromCookie(req)
  await revokeAdminSession(sessionId)
  res.setHeader('Set-Cookie', buildClearSessionCookie())
  return res.status(200).json({ ok: true })
}

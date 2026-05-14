import { getSessionFromCookie, revokeUserSession, buildClearSessionCookie } from '../../../lib/pwAuth.js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const sessionId = getSessionFromCookie(req)
  await revokeUserSession(sessionId)
  res.setHeader('Set-Cookie', buildClearSessionCookie())
  return res.status(200).json({ ok: true })
}

import { getSessionFromCookie, validateAdminSession } from '../../lib/auth.js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  const sessionId = getSessionFromCookie(req)
  const valid = await validateAdminSession(sessionId)
  return res.status(200).json({ authenticated: valid })
}

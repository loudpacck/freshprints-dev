import { verifyAdminPassword, createAdminSession, buildSessionCookie } from '../../lib/auth.js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
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

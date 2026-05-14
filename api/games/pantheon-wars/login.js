import { sql } from '../../../lib/db.js'
import { verifyPassword, createUserSession } from '../../../lib/pwAuth.js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields: email, password' })
  }

  try {
    const userRows = await sql`
      SELECT id, username, email, password_hash, faction, class, alignment, created_at, last_login
      FROM pw_users
      WHERE email = ${email}
      LIMIT 1
    `
    if (userRows.length === 0) {
      await new Promise(r => setTimeout(r, 800))
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = userRows[0]
    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) {
      await new Promise(r => setTimeout(r, 800))
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const statsRows = await sql`
      SELECT level, xp, energy, energy_max, health, health_max,
             drachma, drachma_lifetime, glory, attack, defense, stat_points, last_updated
      FROM pw_player_stats
      WHERE user_id = ${user.id}
    `

    await sql`UPDATE pw_users SET last_login = NOW() WHERE id = ${user.id}`

    await createUserSession(user.id, res)

    const { password_hash, ...safeUser } = user
    return res.status(200).json({ user: safeUser, stats: statsRows[0] || null })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Login failed' })
  }
}

import { sql } from '../../../lib/db.js'
import { hashPassword, createUserSession } from '../../../lib/pwAuth.js'

export const config = { runtime: 'nodejs' }

const VALID_FACTIONS = ['olympians', 'aesir', 'annunaki']
const VALID_CLASSES = ['warden', 'oracle', 'slayer', 'broker']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, email, password, faction, class: playerClass } = req.body || {}

  if (!username || !email || !password || !faction || !playerClass) {
    return res.status(400).json({ error: 'Missing required fields: username, email, password, faction, class' })
  }
  if (!VALID_FACTIONS.includes(faction)) {
    return res.status(400).json({ error: `Invalid faction. Must be one of: ${VALID_FACTIONS.join(', ')}` })
  }
  if (!VALID_CLASSES.includes(playerClass)) {
    return res.status(400).json({ error: `Invalid class. Must be one of: ${VALID_CLASSES.join(', ')}` })
  }
  if (username.length > 30) {
    return res.status(400).json({ error: 'Username must be 30 characters or fewer' })
  }

  try {
    const existing = await sql`
      SELECT id FROM pw_users
      WHERE email = ${email} OR username = ${username}
      LIMIT 1
    `
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already taken' })
    }

    const passwordHash = await hashPassword(password)

    const userRows = await sql`
      INSERT INTO pw_users (username, email, password_hash, faction, class)
      VALUES (${username}, ${email}, ${passwordHash}, ${faction}, ${playerClass})
      RETURNING id, username, email, faction, class, alignment, created_at, last_login
    `
    const user = userRows[0]

    await sql`
      INSERT INTO pw_player_stats (user_id) VALUES (${user.id})
    `

    await createUserSession(user.id, res)

    return res.status(201).json({ user })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: 'Failed to create account' })
  }
}

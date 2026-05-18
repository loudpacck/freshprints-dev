import { sql } from '../../../lib/db.js'
import {
  hashPassword, verifyPassword,
  createUserSession,
  getSessionFromCookie, revokeUserSession, buildClearSessionCookie,
  requireUser,
} from '../../../lib/pwAuth.js'
import { regenPlayer, getEquipmentBonuses, getRaceClassCombatBonuses } from '../../../lib/pwHelpers.js'

export const config = { runtime: 'nodejs' }

// ── Signup ────────────────────────────────────────────────────────────────────

const VALID_FACTIONS = ['olympians', 'aesir', 'annunaki']
const VALID_CLASSES  = ['warden', 'oracle', 'slayer', 'broker']

async function handleSignup(req, res) {
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

    // Starting stats with class and faction bonuses
    let startAttack    = 5
    let startDefense   = 5
    let startAgility   = 0
    let startEnergyMax = 20
    let startEnergy    = 20
    let startHealthMax = 100
    let startHealth    = 100
    let startDrachma   = 500

    if (playerClass === 'warden') { startDefense   += 5 }
    if (playerClass === 'oracle') { startEnergyMax += 5; startEnergy = startEnergyMax }
    if (playerClass === 'slayer') { startAttack    += 5 }
    if (playerClass === 'broker') { startDrachma   += 250 }
    if (faction === 'aesir')      { startAgility   += 2 }

    await sql`
      INSERT INTO pw_player_stats
        (user_id, attack, defense, agility, energy_max, energy, health_max, health, drachma)
      VALUES
        (${user.id}, ${startAttack}, ${startDefense}, ${startAgility},
         ${startEnergyMax}, ${startEnergy}, ${startHealthMax}, ${startHealth}, ${startDrachma})
    `

    await createUserSession(user.id, res)

    return res.status(201).json({ user })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: 'Failed to create account' })
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function handleLogin(req, res) {
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
             drachma, drachma_lifetime, glory, attack, defense, stat_points, last_updated,
             energy_regen_base, health_regen_base
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

// ── Logout ────────────────────────────────────────────────────────────────────

async function handleLogout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const sessionId = getSessionFromCookie(req)
  await revokeUserSession(sessionId)
  res.setHeader('Set-Cookie', buildClearSessionCookie())
  return res.status(200).json({ ok: true })
}

// ── Me ────────────────────────────────────────────────────────────────────────

async function handleMe(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rows = await sql`
      SELECT
        u.id, u.username, u.email, u.faction, u.class, u.alignment,
        u.created_at, u.last_login,
        s.level, s.xp, s.energy, s.energy_max, s.health, s.health_max,
        s.drachma, s.drachma_lifetime, s.glory, s.glory_lifetime, s.attack, s.defense,
        s.stat_points, s.last_updated, s.energy_regen_base, s.health_regen_base
      FROM pw_users u
      JOIN pw_player_stats s ON s.user_id = u.id
      WHERE u.id = ${req.userId}
    `

    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const row = rows[0]
    let statsRaw = {
      level: row.level, xp: row.xp,
      energy: row.energy, energy_max: row.energy_max,
      health: row.health, health_max: row.health_max,
      drachma: row.drachma, drachma_lifetime: row.drachma_lifetime,
      glory: row.glory, glory_lifetime: row.glory_lifetime,
      attack: row.attack, defense: row.defense,
      stat_points: row.stat_points, last_updated: row.last_updated,
      energy_regen_base: row.energy_regen_base, health_regen_base: row.health_regen_base,
    }

    const statsRegen = regenPlayer(statsRaw)
    if (
      statsRegen.energy !== statsRaw.energy ||
      statsRegen.health !== statsRaw.health ||
      statsRegen.energy_regen_base !== statsRaw.energy_regen_base ||
      statsRegen.health_regen_base !== statsRaw.health_regen_base
    ) {
      await sql`
        UPDATE pw_player_stats
        SET energy = ${statsRegen.energy}, health = ${statsRegen.health},
            energy_regen_base = ${statsRegen.energy_regen_base},
            health_regen_base = ${statsRegen.health_regen_base},
            last_updated = ${statsRegen.last_updated}
        WHERE user_id = ${req.userId}
      `
    }

    const equipBonuses = await getEquipmentBonuses(sql, req.userId)
    const rcBonuses    = getRaceClassCombatBonuses(row.faction, row.class)
    const computed_bonuses = {
      crit:    Math.min(75, (equipBonuses.crit  || 0) + (rcBonuses.crit  || 0)),
      dodge:   Math.min(75, (equipBonuses.dodge || 0) + (rcBonuses.dodge || 0)),
      block:   Math.min(75, (equipBonuses.block || 0) + (rcBonuses.block || 0)),
      agility: (statsRegen.agility || 0) + (equipBonuses.agility || 0),
    }

    const user = {
      id:         row.id,
      username:   row.username,
      email:      row.email,
      faction:    row.faction,
      class:      row.class,
      alignment:  row.alignment,
      created_at: row.created_at,
      last_login: row.last_login,
    }

    return res.status(200).json({ user, stats: statsRegen, equipment_bonuses: equipBonuses, computed_bonuses })
  } catch (err) {
    console.error('Me error:', err)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const { action } = req.query
  if (action === 'signup') return handleSignup(req, res)
  if (action === 'login')  return handleLogin(req, res)
  if (action === 'logout') return handleLogout(req, res)
  if (action === 'me')     return requireUser(handleMe)(req, res)
  return res.status(400).json({ error: 'Unknown action' })
}

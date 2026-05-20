import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { sql } from '../../lib/db.js'
import { requireAdmin } from '../../lib/auth.js'
import {
  createModeratorSession,
  validateModeratorSession,
  revokeModeratorSession,
  requireModerator,
  getModSessionFromCookie,
  buildClearModSessionCookie,
  logModAction,
} from '../../lib/modAuth.js'

export const config = { runtime: 'nodejs' }

// ── action=activate ────────────────────────────────────────────────────────────

async function handleActivate(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token, username, password } = req.body || {}
  if (!token || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields: token, username, password' })
  }
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3–30 characters: letters, numbers, underscores only.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }

  try {
    // Find a matching active invite by iterating and bcrypt.compare
    const invites = await sql`
      SELECT * FROM pw_moderator_invites
      WHERE used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC
    `
    let matchedInvite = null
    for (const invite of invites) {
      const ok = await bcrypt.compare(token, invite.token_hash)
      if (ok) { matchedInvite = invite; break }
    }
    if (!matchedInvite) {
      return res.status(400).json({ error: 'invalid_token', message: 'Invite token is invalid or expired.' })
    }

    // Check username not taken
    const existing = await sql`SELECT id FROM pw_moderators WHERE username = ${username} LIMIT 1`
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already taken.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const modRows = await sql`
      INSERT INTO pw_moderators (username, password_hash, invite_token_id)
      VALUES (${username}, ${passwordHash}, ${matchedInvite.id})
      RETURNING id, username
    `
    const mod = modRows[0]

    // Mark invite used
    await sql`
      UPDATE pw_moderator_invites
      SET used = TRUE, used_by = ${mod.id}, used_at = NOW()
      WHERE id = ${matchedInvite.id}
    `

    await createModeratorSession(mod.id, res)
    await logModAction(sql, mod.id, mod.username, 'activate', { invite_id: matchedInvite.id })

    return res.status(201).json({ ok: true, username: mod.username })
  } catch (err) {
    console.error('Moderator activate error:', err)
    return res.status(500).json({ error: 'Activation failed.' })
  }
}

// ── action=login ───────────────────────────────────────────────────────────────

async function handleLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing required fields: username, password' })
  }

  try {
    const rows = await sql`
      SELECT id, username, password_hash
      FROM pw_moderators
      WHERE username = ${username} AND is_active = TRUE
      LIMIT 1
    `
    if (rows.length === 0) {
      await new Promise(r => setTimeout(r, 800))
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    const mod = rows[0]
    const ok  = await bcrypt.compare(password, mod.password_hash)
    if (!ok) {
      await new Promise(r => setTimeout(r, 800))
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    await createModeratorSession(mod.id, res)
    await sql`UPDATE pw_moderators SET last_login = NOW() WHERE id = ${mod.id}`

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null
    await logModAction(sql, mod.id, mod.username, 'login', { ip })

    return res.status(200).json({ ok: true, username: mod.username })
  } catch (err) {
    console.error('Moderator login error:', err)
    return res.status(500).json({ error: 'Login failed.' })
  }
}

// ── action=logout ──────────────────────────────────────────────────────────────

async function handleLogout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const sessionId = getModSessionFromCookie(req)
  await revokeModeratorSession(sessionId)
  res.setHeader('Set-Cookie', buildClearModSessionCookie())
  return res.status(200).json({ ok: true })
}

// ── action=check ───────────────────────────────────────────────────────────────

async function handleCheck(req, res) {
  const mod = await validateModeratorSession(req)
  if (!mod) return res.status(200).json({ authenticated: false })
  return res.status(200).json({ authenticated: true, username: mod.username, moderator_id: mod.moderatorId })
}

// ── action=generate_invite (admin-gated) ───────────────────────────────────────

async function handleGenerateInvite(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const ok = await requireAdmin(req, res)
  if (!ok) return

  const { label } = req.body || {}

  try {
    const token     = randomBytes(16).toString('hex') // 32-char hex
    const tokenHash = await bcrypt.hash(token, 12)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await sql`
      INSERT INTO pw_moderator_invites (token_hash, expires_at, label)
      VALUES (${tokenHash}, ${expiresAt.toISOString()}, ${label || null})
    `

    return res.status(200).json({ ok: true, token, expires_at: expiresAt.toISOString() })
  } catch (err) {
    console.error('Generate invite error:', err)
    return res.status(500).json({ error: 'Failed to generate invite.' })
  }
}

// ── action=list_invites (admin-gated) ─────────────────────────────────────────

async function handleListInvites(req, res) {
  const ok = await requireAdmin(req, res)
  if (!ok) return

  try {
    const rows = await sql`
      SELECT id, label, created_at, expires_at, used, used_at,
             (SELECT username FROM pw_moderators WHERE id = used_by) AS used_by_username
      FROM pw_moderator_invites
      ORDER BY created_at DESC
      LIMIT 50
    `
    return res.status(200).json({ invites: rows })
  } catch (err) {
    console.error('List invites error:', err)
    return res.status(500).json({ error: 'Failed to fetch invites.' })
  }
}

// ── action=list_mods (admin-gated) ────────────────────────────────────────────

async function handleListMods(req, res) {
  const ok = await requireAdmin(req, res)
  if (!ok) return

  try {
    const rows = await sql`
      SELECT id, username, created_at, last_login, is_active
      FROM pw_moderators
      ORDER BY created_at DESC
    `
    return res.status(200).json({ moderators: rows })
  } catch (err) {
    console.error('List mods error:', err)
    return res.status(500).json({ error: 'Failed to fetch moderators.' })
  }
}

// ── action=list_actions (admin-gated) ─────────────────────────────────────────

async function handleListActions(req, res) {
  const ok = await requireAdmin(req, res)
  if (!ok) return

  try {
    const rows = await sql`
      SELECT id, moderator_username, action_type, action_data, created_at
      FROM pw_moderator_actions
      ORDER BY created_at DESC
      LIMIT 100
    `
    return res.status(200).json({ actions: rows })
  } catch (err) {
    console.error('List actions error:', err)
    return res.status(500).json({ error: 'Failed to fetch action log.' })
  }
}

// ── action=deactivate_mod (admin-gated) ───────────────────────────────────────

async function handleDeactivateMod(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const ok = await requireAdmin(req, res)
  if (!ok) return

  const { moderator_id } = req.body || {}
  if (!moderator_id) return res.status(400).json({ error: 'Missing moderator_id' })

  try {
    const rows = await sql`
      UPDATE pw_moderators SET is_active = FALSE
      WHERE id = ${moderator_id} AND is_active = TRUE
      RETURNING username
    `
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Moderator not found or already inactive.' })
    }
    // Revoke all active sessions so they can't keep using the panel
    await sql`DELETE FROM pw_moderator_sessions WHERE moderator_id = ${moderator_id}`
    return res.status(200).json({ ok: true, username: rows[0].username })
  } catch (err) {
    console.error('Deactivate mod error:', err)
    return res.status(500).json({ error: 'Failed to deactivate moderator.' })
  }
}

// ── action=lookup_player (mod-gated) ──────────────────────────────────────────

async function handleLookupPlayer(req, res) {
  const mod = await requireModerator(req, res)
  if (!mod) return

  const q = (req.query.q || '').trim()
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters.' })
  }

  try {
    const pattern = `%${q}%`
    const rows = await sql`
      SELECT u.id, u.username, u.email, u.faction, u.class, u.alignment,
             u.created_at, u.last_login,
             s.level, s.drachma, s.glory, s.attack, s.defense
      FROM pw_users u
      LEFT JOIN pw_player_stats s ON s.user_id = u.id
      WHERE u.username ILIKE ${pattern} OR u.email ILIKE ${pattern}
      ORDER BY u.username
      LIMIT 10
    `

    await logModAction(sql, mod.moderatorId, mod.username, 'account_lookup', {
      query: q,
      results_count: rows.length,
    })

    return res.status(200).json({ players: rows })
  } catch (err) {
    console.error('Lookup player error:', err)
    return res.status(500).json({ error: 'Lookup failed.' })
  }
}

// ── Router ─────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const { action } = req.query
  if (action === 'activate')        return handleActivate(req, res)
  if (action === 'login')           return handleLogin(req, res)
  if (action === 'logout')          return handleLogout(req, res)
  if (action === 'check')           return handleCheck(req, res)
  if (action === 'generate_invite') return handleGenerateInvite(req, res)
  if (action === 'list_invites')    return handleListInvites(req, res)
  if (action === 'list_mods')       return handleListMods(req, res)
  if (action === 'list_actions')    return handleListActions(req, res)
  if (action === 'deactivate_mod')  return handleDeactivateMod(req, res)
  if (action === 'lookup_player')   return handleLookupPlayer(req, res)
  return res.status(400).json({ error: 'Unknown action' })
}

import { sql } from '../../lib/db.js'
import { requireAdmin } from '../../lib/auth.js'

export const config = { runtime: 'nodejs' }

// Public read — layout positions are non-sensitive cosmetic data and must be
// readable by the Township scene for all players, not just logged-in admins.
async function handleGetConfig(req, res) {
  const { key } = req.query
  if (!key) return res.status(400).json({ error: 'Missing key' })

  try {
    const rows = await sql`SELECT value FROM pw_admin_config WHERE key = ${key}`
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ config: rows[0]?.value ?? null })
  } catch (err) {
    console.error('get_config error:', err)
    return res.status(500).json({ error: 'Failed to load config' })
  }
}

async function handleSetConfig(req, res) {
  const { key, value } = req.body || {}
  if (!key || value === undefined) return res.status(400).json({ error: 'Missing key or value' })

  try {
    await sql`
      INSERT INTO pw_admin_config (key, value, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
    `
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('set_config error:', err)
    return res.status(500).json({ error: 'Failed to save config' })
  }
}

// --- /hire page stats (editable in Admin > Hire Stats) ---------------------

const HIRE_STATS_KEYS = ['gamePageViews', 'questsCompleted', 'pvpFights', 'drachmaEconomy', 'activePlayers']

async function fetchHireStatsRow() {
  const rows = await sql`
    SELECT game_page_views, quests_completed, pvp_fights, drachma_economy, active_players, updated_at
    FROM hire_page_stats WHERE id = 1
  `
  return rows[0] || null
}

function serializeHireStats(row, includeTimestamp) {
  const stats = {
    gamePageViews: Number(row.game_page_views),
    questsCompleted: Number(row.quests_completed),
    pvpFights: Number(row.pvp_fights),
    drachmaEconomy: Number(row.drachma_economy),
    activePlayers: Number(row.active_players),
  }
  if (includeTimestamp) stats.updatedAt = row.updated_at
  return stats
}

// Public read — visitors on /hire need these numbers without logging in.
// Non-sensitive display counts only, no other admin data is exposed here.
async function handleHireStatsPublic(req, res) {
  try {
    const row = await fetchHireStatsRow()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ stats: row ? serializeHireStats(row, false) : null })
  } catch (err) {
    console.error('hire_stats error:', err)
    return res.status(500).json({ error: 'Failed to load hire stats' })
  }
}

async function handleGetHireStats(req, res) {
  try {
    const row = await fetchHireStatsRow()
    if (!row) return res.status(404).json({ error: 'No hire stats row found' })
    return res.status(200).json({ stats: serializeHireStats(row, true) })
  } catch (err) {
    console.error('get_hire_stats error:', err)
    return res.status(500).json({ error: 'Failed to load hire stats' })
  }
}

function validateNonNegativeInt(v) {
  const n = Number(v)
  return typeof v !== 'boolean' && v !== '' && v !== null && Number.isInteger(n) && n >= 0 ? n : null
}

async function handleSaveHireStats(req, res) {
  const body = req.body || {}
  const parsed = {}
  for (const key of HIRE_STATS_KEYS) {
    const n = validateNonNegativeInt(body[key])
    if (n === null) {
      return res.status(400).json({ error: `Invalid value for "${key}": must be a non-negative integer` })
    }
    parsed[key] = n
  }

  try {
    const rows = await sql`
      UPDATE hire_page_stats SET
        game_page_views = ${parsed.gamePageViews},
        quests_completed = ${parsed.questsCompleted},
        pvp_fights = ${parsed.pvpFights},
        drachma_economy = ${parsed.drachmaEconomy},
        active_players = ${parsed.activePlayers},
        updated_at = NOW()
      WHERE id = 1
      RETURNING game_page_views, quests_completed, pvp_fights, drachma_economy, active_players, updated_at
    `
    if (rows.length === 0) return res.status(404).json({ error: 'No hire stats row found' })
    return res.status(200).json({ stats: serializeHireStats(rows[0], true) })
  } catch (err) {
    console.error('save_hire_stats error:', err)
    return res.status(500).json({ error: 'Failed to save hire stats' })
  }
}

// --- Blobert admin (chat-log dashboard) ------------------------------------

const BLOBERT_DAILY_CAP = 1000

function rollupAnsweredBy(rows) {
  const o = { cache: 0, fuzzy: 0, ai: 0, ratelimited: 0, capped: 0 }
  for (const r of rows) {
    if (r.answered_by in o) o[r.answered_by] = Number(r.c)
  }
  return o
}

async function handleBlobertAdmin(req, res) {
  const { session } = req.query

  // Full transcript for one session.
  if (session) {
    try {
      const rows = await sql`
        SELECT role, content, answered_by, theme, tone, created_at
        FROM hire_buddy_logs
        WHERE session_id = ${session}
        ORDER BY created_at ASC, id ASC
      `
      return res.status(200).json({ transcript: rows })
    } catch (err) {
      console.error('blobert transcript error:', err)
      return res.status(500).json({ error: 'Failed to load transcript' })
    }
  }

  try {
    const [by24h, by30d, aiToday, chats24h, sessions, dailyVolume] = await Promise.all([
      sql`SELECT answered_by, COUNT(*)::int AS c FROM hire_buddy_logs WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY answered_by`,
      sql`SELECT answered_by, COUNT(*)::int AS c FROM hire_buddy_logs WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY answered_by`,
      // Matches the brain's own cap query exactly (all 'ai' rows this UTC day).
      sql`SELECT COUNT(*)::int AS c FROM hire_buddy_logs WHERE answered_by = 'ai' AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'`,
      sql`SELECT COUNT(DISTINCT session_id)::int AS c FROM hire_buddy_logs WHERE created_at > NOW() - INTERVAL '24 hours'`,
      sql`
        SELECT
          session_id,
          MAX(created_at) AS last_activity,
          COUNT(*) FILTER (WHERE role = 'user')::int AS turns,
          ARRAY_AGG(DISTINCT answered_by) AS sources,
          (ARRAY_AGG(content ORDER BY created_at ASC, id ASC) FILTER (WHERE role = 'user'))[1] AS first_message
        FROM hire_buddy_logs
        WHERE session_id IS NOT NULL
        GROUP BY session_id
        ORDER BY last_activity DESC
        LIMIT 20
      `,
      sql`
        SELECT DATE_TRUNC('day', created_at) AS day, answered_by, COUNT(*)::int AS c
        FROM hire_buddy_logs
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY day, answered_by
        ORDER BY day ASC
      `,
    ])

    return res.status(200).json({
      last24h: rollupAnsweredBy(by24h),
      last30d: rollupAnsweredBy(by30d),
      aiToday: Number(aiToday[0]?.c || 0),
      dailyCap: BLOBERT_DAILY_CAP,
      chats24h: Number(chats24h[0]?.c || 0),
      sessions: sessions.map(s => ({
        session_id: s.session_id,
        first_message: s.first_message || '',
        turns: Number(s.turns || 0),
        last_activity: s.last_activity,
        sources: (s.sources || []).filter(Boolean),
      })),
      dailyVolume: dailyVolume.map(r => ({ day: r.day, answered_by: r.answered_by, count: Number(r.c) })),
    })
  } catch (err) {
    console.error('blobert admin error:', err)
    return res.status(500).json({ error: 'Failed to load Blobert stats' })
  }
}

export default async function handler(req, res) {
  const { action } = req.query

  if (action === 'get_config') return handleGetConfig(req, res)
  if (action === 'hire_stats') return handleHireStatsPublic(req, res)

  if (!(await requireAdmin(req, res))) return

  if (req.query.section === 'blobert') return handleBlobertAdmin(req, res)

  if (action === 'set_config') return handleSetConfig(req, res)
  if (action === 'get_hire_stats') return handleGetHireStats(req, res)
  if (action === 'save_hire_stats') return handleSaveHireStats(req, res)

  try {
    const [
      pageViewsToday, pageViewsTotal, visitorsTotal, sessionsTotal,
      recentEvents, topPaths, dailyChart,
      dailyUniqueVisitors, deviceBreakdown, browserBreakdown, topReferrers,
    ] = await Promise.all([
      sql`SELECT COUNT(*) AS c FROM events WHERE event_type = 'page_view' AND timestamp > NOW() - INTERVAL '1 day'`,
      sql`SELECT COUNT(*) AS c FROM events WHERE event_type = 'page_view'`,
      sql`SELECT COUNT(*) AS c FROM visitors`,
      sql`SELECT COUNT(*) AS c FROM sessions`,
      sql`SELECT event_type, path, timestamp, ui_theme FROM events ORDER BY timestamp DESC LIMIT 50`,
      sql`SELECT path, COUNT(*) AS count FROM events WHERE event_type = 'page_view' GROUP BY path ORDER BY count DESC LIMIT 10`,
      sql`
        SELECT DATE_TRUNC('day', timestamp) AS day, COUNT(*) AS views
        FROM events
        WHERE event_type = 'page_view' AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `,
      sql`
        SELECT DATE_TRUNC('day', timestamp) AS day, COUNT(DISTINCT visitor_id) AS unique_visitors
        FROM events
        WHERE event_type = 'page_view' AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `,
      sql`SELECT device_type, COUNT(*) AS count FROM sessions GROUP BY device_type`,
      sql`SELECT browser, COUNT(*) AS count FROM sessions GROUP BY browser ORDER BY count DESC LIMIT 8`,
      sql`
        SELECT referrer, COUNT(*) AS count
        FROM sessions
        WHERE referrer IS NOT NULL AND referrer != ''
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
      `,
    ])

    return res.status(200).json({
      pageViewsToday:        Number(pageViewsToday[0].c),
      pageViewsTotal:        Number(pageViewsTotal[0].c),
      visitorsTotal:         Number(visitorsTotal[0].c),
      sessionsTotal:         Number(sessionsTotal[0].c),
      recentEvents,
      topPaths:              topPaths.map(r => ({ path: r.path, count: Number(r.count) })),
      dailyChart:            dailyChart.map(r => ({ day: r.day, views: Number(r.views) })),
      dailyUniqueVisitors:   dailyUniqueVisitors.map(r => ({ day: r.day, unique_visitors: Number(r.unique_visitors) })),
      deviceBreakdown:       deviceBreakdown.map(r => ({ device_type: r.device_type || 'unknown', count: Number(r.count) })),
      browserBreakdown:      browserBreakdown.map(r => ({ browser: r.browser || 'unknown', count: Number(r.count) })),
      topReferrers:          topReferrers.map(r => ({ referrer: r.referrer, count: Number(r.count) })),
    })
  } catch (err) {
    console.error('Overview error:', err)
    return res.status(500).json({ error: 'Failed to load overview' })
  }
}

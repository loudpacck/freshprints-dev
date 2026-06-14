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

export default async function handler(req, res) {
  const { action } = req.query

  if (action === 'get_config') return handleGetConfig(req, res)

  if (!(await requireAdmin(req, res))) return

  if (action === 'set_config') return handleSetConfig(req, res)

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

import { sql } from '../../lib/db.js'
import { requireAdmin } from '../../lib/auth.js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return

  try {
    const [pageViewsToday, pageViewsTotal, visitorsTotal, sessionsTotal, recentEvents, topPaths, dailyChart] = await Promise.all([
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
    ])

    return res.status(200).json({
      pageViewsToday: Number(pageViewsToday[0].c),
      pageViewsTotal: Number(pageViewsTotal[0].c),
      visitorsTotal: Number(visitorsTotal[0].c),
      sessionsTotal: Number(sessionsTotal[0].c),
      recentEvents,
      topPaths: topPaths.map(r => ({ path: r.path, count: Number(r.count) })),
      dailyChart: dailyChart.map(r => ({ day: r.day, views: Number(r.views) })),
    })
  } catch (err) {
    console.error('Overview error:', err)
    return res.status(500).json({ error: 'Failed to load overview' })
  }
}

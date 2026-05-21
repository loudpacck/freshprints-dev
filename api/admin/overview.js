import { sql } from '../../lib/db.js'
import { requireAdmin } from '../../lib/auth.js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return

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

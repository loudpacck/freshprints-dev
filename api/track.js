import { sql } from '../lib/db.js'
import { UAParser } from 'ua-parser-js'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { events, sessionId, visitorId, path: currentPath, uiTheme, uiMode } = req.body

    if (!sessionId || !visitorId || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Invalid payload' })
    }

    const country = req.headers['x-vercel-ip-country'] || null
    const region  = req.headers['x-vercel-ip-country-region'] || null
    const city    = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null
    const ua      = req.headers['user-agent'] || ''

    const parser = new UAParser(ua)
    const device = parser.getDevice()
    const browser = parser.getBrowser()
    const os = parser.getOS()

    const deviceType = device.type || 'desktop'
    const browserName = browser.name || 'unknown'
    const osName = os.name || 'unknown'
    const referrer = req.headers.referer || null

    await sql`
      INSERT INTO visitors (id, country, last_seen_at, session_count)
      VALUES (${visitorId}, ${country}, NOW(), 1)
      ON CONFLICT (id) DO UPDATE SET
        last_seen_at = NOW(),
        country = COALESCE(visitors.country, EXCLUDED.country)
    `

    await sql`
      INSERT INTO sessions (
        id, visitor_id, last_seen_at,
        country, region, city,
        device_type, browser, os,
        ui_theme, ui_mode, referrer, entry_path
      )
      VALUES (
        ${sessionId}, ${visitorId}, NOW(),
        ${country}, ${region}, ${city},
        ${deviceType}, ${browserName}, ${osName},
        ${uiTheme}, ${uiMode}, ${referrer}, ${currentPath}
      )
      ON CONFLICT (id) DO UPDATE SET
        last_seen_at = NOW(),
        ui_theme = EXCLUDED.ui_theme,
        ui_mode = EXCLUDED.ui_mode
    `

    for (const ev of events) {
      const { type, data, ts } = ev
      await sql`
        INSERT INTO events (event_type, event_data, session_id, visitor_id, path, ui_theme, ui_mode, timestamp)
        VALUES (${type}, ${JSON.stringify(data || {})}, ${sessionId}, ${visitorId}, ${currentPath}, ${uiTheme}, ${uiMode}, ${ts ? new Date(ts).toISOString() : new Date().toISOString()})
      `
    }

    const pageViews = events.filter(e => e.type === 'page_view').length
    if (pageViews > 0) {
      await sql`UPDATE sessions SET page_count = page_count + ${pageViews} WHERE id = ${sessionId}`
    }

    return res.status(200).json({ ok: true, recorded: events.length })
  } catch (err) {
    console.error('[/api/track] CRASH:', err.message)
    console.error('[/api/track] STACK:', err.stack)
    return res.status(500).json({ error: 'Track failed', detail: err.message })
  }
}

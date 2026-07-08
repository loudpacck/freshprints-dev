import { sql } from '../lib/db.js'
import { UAParser } from 'ua-parser-js'

export const config = { runtime: 'nodejs' }

// Ingest limits: at most 50 events per request (excess silently truncated);
// each event's serialized event_data is capped at 8KB (oversized data replaced
// with a truncation marker so the event itself is still recorded).
const MAX_EVENTS_PER_REQUEST = 50
const MAX_EVENT_DATA_BYTES = 8 * 1024

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

    const accepted = events.slice(0, MAX_EVENTS_PER_REQUEST)

    // Build one multi-row INSERT (single Neon round-trip)
    const params = []
    const rows = accepted.map(ev => {
      const { type, data, ts } = ev
      let eventData = JSON.stringify(data || {})
      if (eventData.length > MAX_EVENT_DATA_BYTES) {
        eventData = JSON.stringify({ truncated: true, originalBytes: eventData.length })
      }
      const base = params.length
      params.push(
        type,
        eventData,
        sessionId,
        visitorId,
        currentPath,
        uiTheme,
        uiMode,
        ts ? new Date(ts).toISOString() : new Date().toISOString()
      )
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`
    })

    await sql.query(
      `INSERT INTO events (event_type, event_data, session_id, visitor_id, path, ui_theme, ui_mode, timestamp)
       VALUES ${rows.join(', ')}`,
      params
    )

    const pageViews = accepted.filter(e => e.type === 'page_view').length
    if (pageViews > 0) {
      await sql`UPDATE sessions SET page_count = page_count + ${pageViews} WHERE id = ${sessionId}`
    }

    return res.status(200).json({ ok: true, recorded: accepted.length })
  } catch (err) {
    console.error('[/api/track] CRASH:', err.message)
    console.error('[/api/track] STACK:', err.stack)
    return res.status(500).json({ error: 'Track failed', detail: err.message })
  }
}

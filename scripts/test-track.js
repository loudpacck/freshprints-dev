// Simulates one full /api/track request against the real DB
// Run: node scripts/test-track.js
import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { UAParser } from 'ua-parser-js'

const DATABASE_URL = process.env.POSTGRES_DATABASE_URL || process.env.POSTGRES_URL
console.log('DB URL present:', !!DATABASE_URL)

const sql = neon(DATABASE_URL)

const visitorId = 'test-visitor-' + Date.now()
const sessionId = 'test-session-' + Date.now()
const uiTheme = 'standard'
const uiMode = 'dark'
const currentPath = '/test'
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

const parser = new UAParser(ua)
const device = parser.getDevice()
const browser = parser.getBrowser()
const os = parser.getOS()

const deviceType = device.type || 'desktop'
const browserName = browser.name || 'unknown'
const osName = os.name || 'unknown'
const country = 'US'
const region = 'NY'
const city = 'New York'
const referrer = null

console.log('Parsed UA:', { deviceType, browserName, osName })

try {
  console.log('\n1. Inserting visitor...')
  await sql`
    INSERT INTO visitors (id, country, last_seen_at, session_count)
    VALUES (${visitorId}, ${country}, NOW(), 1)
    ON CONFLICT (id) DO UPDATE SET
      last_seen_at = NOW(),
      country = COALESCE(visitors.country, EXCLUDED.country)
  `
  console.log('   ✓ visitor inserted')

  console.log('2. Inserting session...')
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
  console.log('   ✓ session inserted')

  const events = [
    { type: 'page_view', data: { path: '/test', title: 'Test', referrer: '' }, ts: Date.now() }
  ]

  console.log('3. Inserting events...')
  for (const ev of events) {
    const { type, data, ts } = ev
    await sql`
      INSERT INTO events (event_type, event_data, session_id, visitor_id, path, ui_theme, ui_mode, timestamp)
      VALUES (${type}, ${JSON.stringify(data || {})}, ${sessionId}, ${visitorId}, ${currentPath}, ${uiTheme}, ${uiMode}, ${ts ? new Date(ts).toISOString() : new Date().toISOString()})
    `
  }
  console.log('   ✓ events inserted')

  console.log('4. Updating page_count...')
  const pageViews = events.filter(e => e.type === 'page_view').length
  await sql`UPDATE sessions SET page_count = page_count + ${pageViews} WHERE id = ${sessionId}`
  console.log('   ✓ page_count updated')

  console.log('\n✅ All steps passed. Cleaning up test data...')
  await sql`DELETE FROM visitors WHERE id = ${visitorId}`
  console.log('✅ Cleanup done.')
} catch (err) {
  console.error('\n❌ FAILED:', err.message)
  console.error(err.stack)
}

process.exit(0)

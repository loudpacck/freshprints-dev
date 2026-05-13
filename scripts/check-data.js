import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const DATABASE_URL =
  process.env.POSTGRES_DATABASE_URL ||
  process.env.POSTGRES_URL

if (!DATABASE_URL) {
  console.error('No DATABASE_URL found')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

try {
  const [visitors, sessions, events, recentEvents, tables] = await Promise.all([
    sql`SELECT COUNT(*) as c FROM visitors`,
    sql`SELECT COUNT(*) as c FROM sessions`,
    sql`SELECT COUNT(*) as c FROM events`,
    sql`SELECT event_type, path, timestamp FROM events ORDER BY timestamp DESC LIMIT 10`,
    sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
  ])

  console.log('Tables in DB:', tables.map(t => t.table_name).join(', '))
  console.log('Visitors:', visitors[0].c)
  console.log('Sessions:', sessions[0].c)
  console.log('Events:', events[0].c)
  console.log('Recent events:')
  if (recentEvents.length === 0) {
    console.log('  (none)')
  } else {
    recentEvents.forEach(e => console.log(`  ${e.timestamp} | ${e.event_type} | ${e.path}`))
  }
} catch (err) {
  console.error('DB error:', err.message)
}

process.exit(0)

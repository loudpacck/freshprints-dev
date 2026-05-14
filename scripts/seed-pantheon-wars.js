import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { config } from 'dotenv'
config({ path: '.env.local' })
config()

const DATABASE_URL =
  process.env.POSTGRES_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED
if (!DATABASE_URL) {
  console.error('No database URL found in env. Looked for POSTGRES_DATABASE_URL, POSTGRES_URL, POSTGRES_DATABASE_URL_UNPOOLED, POSTGRES_URL_NON_POOLING, DATABASE_URL, DATABASE_URL_UNPOOLED')
  process.exit(1)
}

const sql = neon(DATABASE_URL)
const seed = readFileSync('./db/seed-pantheon-wars.sql', 'utf-8')
const statements = seed.split(';').map(s => s.trim()).filter(s => s.length > 0)

for (const stmt of statements) {
  try {
    await sql.query(stmt)
    console.log('✓', stmt.split('\n')[0].slice(0, 60))
  } catch (err) {
    console.error('✗', stmt.split('\n')[0].slice(0, 60), '—', err.message)
  }
}

console.log('\nPantheon Wars quests seeded.')
process.exit(0)

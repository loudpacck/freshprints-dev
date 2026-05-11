import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import 'dotenv/config'

const DATABASE_URL = process.env.POSTGRES_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('No database URL found in env. Looked for POSTGRES_DATABASE_URL, POSTGRES_URL, DATABASE_URL')
  process.exit(1)
}

const sql = neon(DATABASE_URL)
const schema = readFileSync('./db/schema.sql', 'utf-8')
const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0)

for (const stmt of statements) {
  try {
    await sql.query(stmt)
    console.log('✓', stmt.split('\n')[0].slice(0, 60))
  } catch (err) {
    console.error('✗', stmt.split('\n')[0].slice(0, 60), '—', err.message)
  }
}

console.log('\nDB initialized.')
process.exit(0)

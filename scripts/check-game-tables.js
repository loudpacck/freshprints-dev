import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })

const sql = neon(process.env.POSTGRES_DATABASE_URL || process.env.POSTGRES_URL)

const tables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name LIKE 'pw_%'
  ORDER BY table_name
`

console.log('Existing PW tables:')
tables.forEach(t => console.log(' ✓', t.table_name))

try {
  const [count] = await sql`SELECT COUNT(*) as c FROM pw_items`
  console.log('\npw_items row count:', count.c)
} catch (e) {
  console.log('\npw_items: DOES NOT EXIST —', e.message)
}

try {
  const [count] = await sql`SELECT COUNT(*) as c FROM pw_inventory`
  console.log('pw_inventory row count:', count.c)
} catch (e) {
  console.log('pw_inventory: DOES NOT EXIST —', e.message)
}

try {
  const [count] = await sql`SELECT COUNT(*) as c FROM pw_quest_loot`
  console.log('pw_quest_loot row count:', count.c)
} catch (e) {
  console.log('pw_quest_loot: DOES NOT EXIST —', e.message)
}

process.exit(0)

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.POSTGRES_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('Missing database URL env var')
}

export const sql = neon(DATABASE_URL)

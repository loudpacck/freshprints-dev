import { neon } from '@neondatabase/serverless'
import { processExpiredTitanEvents, scheduleNextTitanEvent } from '../../../lib/pwHelpers.js'
import { requireAdmin } from '../../../lib/auth.js'

const sql = neon(process.env.POSTGRES_DATABASE_URL || process.env.POSTGRES_URL)

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization || ''
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCron) {
    // Fallback to admin auth for manual triggers via /admin
    if (!(await requireAdmin(req, res))) return
  }

  const slot = req.query?.event || 'cron'

  try {
    // Retroactively open any events created before queue_opens_at = NOW() rule
    await sql`
      UPDATE pw_titan_events
      SET queue_opens_at = NOW()
      WHERE status = 'queue' AND queue_opens_at > NOW()
    `.catch(() => {})

    const didWork     = await processExpiredTitanEvents(sql)
    const nextFightAt = await scheduleNextTitanEvent(sql)

    return res.status(200).json({
      ok:            true,
      slot,
      processed:     didWork,
      next_event_at: nextFightAt.toISOString(),
    })
  } catch (err) {
    console.error('[titan-cron] error:', err)
    return res.status(500).json({ error: 'cron_failed', message: err.message })
  }
}

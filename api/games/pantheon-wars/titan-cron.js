import { neon } from '@neondatabase/serverless'
import { simulateTitanFight, getPlayerTownships, aggregateTownshipBonuses } from '../../../lib/pwHelpers.js'
import { requireAdmin } from '../../../lib/auth.js'

const sql = neon(process.env.POSTGRES_DATABASE_URL || process.env.POSTGRES_URL)

export const config = { runtime: 'nodejs' }

// Batch-fetch equipment bonuses for an array of user_ids.
// Returns a map: { [user_id]: { attack, defense, agility, crit, block, dodge } }
async function fetchEquipBonusesBatch(userIds) {
  if (!userIds.length) return {}
  const rows = await sql`
    SELECT inv.user_id,
           SUM(i.attack_bonus)  AS attack,
           SUM(i.defense_bonus) AS defense,
           SUM(i.agility_bonus) AS agility,
           SUM(i.crit_chance)   AS crit,
           SUM(i.block_chance)  AS block,
           SUM(i.dodge_chance)  AS dodge
    FROM pw_inventory inv
    JOIN pw_items i ON i.id = inv.item_id
    WHERE inv.user_id = ANY(${userIds}::uuid[])
      AND inv.equipped = true
    GROUP BY inv.user_id
  `
  const map = {}
  for (const r of rows) {
    map[r.user_id] = {
      attack:  Number(r.attack)  || 0,
      defense: Number(r.defense) || 0,
      agility: Number(r.agility) || 0,
      crit:    Number(r.crit)    || 0,
      block:   Number(r.block)   || 0,
      dodge:   Number(r.dodge)   || 0,
    }
  }
  // Fill in zeroes for any user with no equipped items
  for (const uid of userIds) {
    if (!map[uid]) map[uid] = { attack: 0, defense: 0, agility: 0, crit: 0, block: 0, dodge: 0 }
  }
  return map
}

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
    let resolvedCount = 0
    let startedCount  = 0

    // ── STEP 1: Resolve active fights whose fight_ends_at has passed ─────────
    const expiredFights = await sql`
      SELECT id FROM pw_titan_events
      WHERE status = 'active' AND fight_ends_at <= NOW()
    `
    for (const fight of expiredFights) {
      await sql`
        UPDATE pw_titan_events SET status = 'resolved'
        WHERE id = ${fight.id}
      `
      resolvedCount++
    }

    // ── STEP 2: Start fights whose queue window has closed ───────────────────
    const queuedEvents = await sql`
      SELECT * FROM pw_titan_events
      WHERE status = 'queue' AND queue_closes_at <= NOW()
    `

    for (const event of queuedEvents) {
      // Fetch queued participants
      const participantRows = await sql`
        SELECT p.user_id, u.username, u.faction, u.class,
               ps.level, ps.attack, ps.defense, ps.agility, ps.health
        FROM pw_titan_participants p
        JOIN pw_users u  ON u.id  = p.user_id
        JOIN pw_player_stats ps ON ps.user_id = p.user_id
        WHERE p.event_id = ${event.id} AND p.status = 'queued'
      `

      if (participantRows.length === 0) {
        await sql`UPDATE pw_titan_events SET status = 'expired' WHERE id = ${event.id}`
        continue
      }

      // Batch equipment bonuses — one query for all participants
      const userIds = participantRows.map(p => p.user_id)
      const equipMap = await fetchEquipBonusesBatch(userIds)

      // Batch township bonuses for all participants
      const townshipBonusesByUser = {}
      for (const p of participantRows) {
        const tRows = await getPlayerTownships(sql, p.user_id)
        townshipBonusesByUser[p.user_id] = aggregateTownshipBonuses(tRows)
      }

      // Build participant objects for simulation (township flat bonuses applied to combat stats only)
      const participants = participantRows.map(p => {
        const tb = townshipBonusesByUser[p.user_id]
        return {
          user_id:      p.user_id,
          username:     p.username,
          level:        p.level,
          faction:      p.faction,
          class:        p.class,
          stats: {
            attack:  p.attack  + Math.floor(tb.flat_attack  || 0),
            defense: p.defense + Math.floor(tb.flat_defense || 0),
            agility: p.agility || 0,
            health:  p.health,
            level:   p.level,
          },
          equipBonuses: equipMap[p.user_id],
        }
      })

      // Fetch Titan
      const titanRows = await sql`SELECT * FROM pw_titans WHERE id = ${event.titan_id}`
      if (!titanRows.length) {
        await sql`UPDATE pw_titan_events SET status = 'expired' WHERE id = ${event.id}`
        continue
      }
      const titan = titanRows[0]

      // Simulate the fight
      const fight = simulateTitanFight(titan, participants)
      const fightEndsAt = new Date(Date.now() + fight.fight_duration_seconds * 1000)

      // Persist fight result onto event row
      await sql`
        UPDATE pw_titan_events SET
          status                 = 'active',
          fight_ends_at          = ${fightEndsAt.toISOString()},
          fight_duration_seconds = ${fight.fight_duration_seconds},
          titan_starting_hp      = ${fight.titan_starting_hp},
          titan_final_hp         = ${fight.titan_final_hp},
          result                 = ${fight.result},
          fight_log              = ${JSON.stringify(fight.fight_log)}::jsonb
        WHERE id = ${event.id}
      `

      // Persist per-participant results (rewards resolved in Pass 2 handler)
      for (const pr of fight.participant_results) {
        await sql`
          UPDATE pw_titan_participants SET
            status            = 'fought',
            damage_dealt      = ${pr.damage_dealt},
            hp_lost           = ${pr.hp_lost},
            contribution_rank = ${pr.contribution_rank},
            reward_tier       = ${pr.reward_tier}
          WHERE event_id = ${event.id} AND user_id = ${pr.user_id}
        `
      }

      startedCount++
    }

    // ── STEP 3: Schedule the next event (12 hours from now) ─────────────────
    const nextFightAt     = new Date(Date.now() + 12 * 60 * 60 * 1000)
    const nextQueueOpenAt = new Date(nextFightAt.getTime() - 60 * 60 * 1000)

    const nextTitanRows = await sql`SELECT id FROM pw_titans ORDER BY RANDOM() LIMIT 1`
    const nextTitanId   = nextTitanRows[0].id

    await sql`
      INSERT INTO pw_titan_events
        (titan_id, status, queue_opens_at, queue_closes_at, fight_starts_at, titan_starting_hp, triggered_by)
      VALUES
        (${nextTitanId}, 'queue',
         ${nextQueueOpenAt.toISOString()},
         ${nextFightAt.toISOString()},
         ${nextFightAt.toISOString()},
         0, 'cron')
    `

    return res.status(200).json({
      ok:             true,
      slot,
      resolved:       resolvedCount,
      started:        startedCount,
      next_event_at:  nextFightAt.toISOString(),
    })
  } catch (err) {
    console.error('[titan-cron] error:', err)
    return res.status(500).json({ error: 'cron_failed', message: err.message })
  }
}

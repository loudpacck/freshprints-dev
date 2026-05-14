import { sql } from '../../../../lib/db.js'
import { requireUser } from '../../../../lib/pwAuth.js'
import { regenPlayer, checkLevelUp } from '../../../../lib/pwHelpers.js'

export const config = { runtime: 'nodejs' }

export default requireUser(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { quest_id } = req.body ?? {}
  if (!quest_id) return res.status(400).json({ error: 'quest_id is required' })

  try {
    // Fetch player (user + stats in one query)
    const rows = await sql`
      SELECT
        u.faction, u.class,
        s.user_id, s.level, s.xp, s.energy, s.energy_max,
        s.health, s.health_max, s.drachma, s.drachma_lifetime,
        s.glory, s.attack, s.defense, s.stat_points, s.last_updated
      FROM pw_users u
      JOIN pw_player_stats s ON s.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const row = rows[0]
    const { faction } = row
    const playerClass = row.class

    // Regen before any validation
    let stats = regenPlayer(row)

    // Fetch quest
    const questRows = await sql`SELECT * FROM pw_quests WHERE id = ${quest_id}`
    if (questRows.length === 0) return res.status(404).json({ error: 'Quest not found' })
    const quest = questRows[0]

    if (stats.level < quest.level_required) {
      return res.status(400).json({ error: `Requires level ${quest.level_required}` })
    }
    if (stats.energy < quest.energy_cost) {
      return res.status(400).json({ error: 'Not enough energy' })
    }

    // Deduct energy
    stats = { ...stats, energy: stats.energy - quest.energy_cost }

    // Rewards (GDD §5.4)
    const drachmaRoll = quest.drachma_range > 0
      ? Math.floor(Math.random() * (quest.drachma_range + 1))
      : 0
    const baseDrachma = quest.drachma_base + drachmaRoll

    const xpMult      = faction === 'olympians' ? 1.05 : 1
    const drachmaMult = (faction === 'annunaki' ? 1.05 : 1) * (playerClass === 'broker' ? 1.1 : 1)

    const earnedXp      = Math.floor(quest.xp_reward * xpMult)
    const earnedDrachma = Math.floor(baseDrachma * drachmaMult)

    stats = {
      ...stats,
      xp:               stats.xp + earnedXp,
      drachma:          stats.drachma + earnedDrachma,
      drachma_lifetime: stats.drachma_lifetime + earnedDrachma,
    }

    // Level-up check
    const prevLevel = stats.level
    stats = checkLevelUp(stats)
    const levelsGained = stats.level - prevLevel

    // Loot roll (Phase 3 will resolve item drops; placeholder for now)
    const lootDropped = quest.loot_chance > 0 && Math.random() * 100 <= quest.loot_chance

    // Increment mastery
    const progRows = await sql`
      SELECT completions FROM pw_quest_progress
      WHERE user_id = ${req.userId} AND quest_id = ${quest_id}
    `
    const newCompletions = (progRows.length > 0 ? progRows[0].completions : 0) + 1

    // Persist stats
    await sql`
      UPDATE pw_player_stats SET
        energy           = ${stats.energy},
        health           = ${stats.health},
        xp               = ${stats.xp},
        level            = ${stats.level},
        drachma          = ${stats.drachma},
        drachma_lifetime = ${stats.drachma_lifetime},
        stat_points      = ${stats.stat_points},
        last_updated     = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    // Upsert mastery progress
    await sql`
      INSERT INTO pw_quest_progress (user_id, quest_id, completions)
      VALUES (${req.userId}, ${quest_id}, ${newCompletions})
      ON CONFLICT (user_id, quest_id) DO UPDATE SET completions = ${newCompletions}
    `

    return res.status(200).json({
      success:      true,
      rewards:      { xp: earnedXp, drachma: earnedDrachma, loot: lootDropped ? 'drop' : null },
      levelsGained,
      completions:  newCompletions,
      stats: {
        level:            stats.level,
        xp:               stats.xp,
        energy:           stats.energy,
        energy_max:       stats.energy_max,
        health:           stats.health,
        health_max:       stats.health_max,
        drachma:          stats.drachma,
        drachma_lifetime: stats.drachma_lifetime,
        glory:            stats.glory,
        attack:           stats.attack,
        defense:          stats.defense,
        stat_points:      stats.stat_points,
      },
    })
  } catch (err) {
    console.error('Quest complete error:', err)
    return res.status(500).json({ error: 'Failed to complete quest' })
  }
})

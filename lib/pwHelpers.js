// Game logic helpers — pure functions, no DB calls.
// Callers are responsible for persisting the returned stats object.

const MAX_LEVEL = 100

/**
 * Calculates passive energy and health regen since last_updated.
 * Run at the top of every game API handler before processing the request.
 * Temple income regen will be added here in Phase 4.
 *
 * Rates (GDD §4.1):
 *   energy: 1 per 300 s (5 min)
 *   health:  1 per 180 s (3 min)
 */
export function regenPlayer(playerStats) {
  const now = new Date()
  const elapsedSeconds = Math.floor((now - new Date(playerStats.last_updated)) / 1000)

  if (elapsedSeconds <= 0) return { ...playerStats }

  const energyGained = Math.floor(elapsedSeconds / 300)
  const healthGained  = Math.floor(elapsedSeconds / 180)

  return {
    ...playerStats,
    energy: Math.min(playerStats.energy + energyGained, playerStats.energy_max),
    health:  Math.min(playerStats.health  + healthGained,  playerStats.health_max),
    last_updated: now.toISOString(),
  }
}

/**
 * Checks if accumulated XP triggers one or more level-ups.
 * Handles multi-level jumps in a single call.
 * On each level-up: 5 stat points awarded, energy and health fully restored.
 * XP threshold formula (GDD §9): floor(100 * level^1.5)
 */
export function checkLevelUp(playerStats) {
  let { level, xp, stat_points, energy_max, health_max } = playerStats
  let leveled = false

  while (level < MAX_LEVEL) {
    const threshold = Math.floor(100 * Math.pow(level, 1.5))
    if (xp < threshold) break
    xp -= threshold
    level++
    stat_points += 5
    leveled = true
  }

  if (!leveled) return { ...playerStats }

  return {
    ...playerStats,
    level,
    xp,
    stat_points,
    // Fully restore on level-up; stat allocation (energy_max/health_max bumps) is separate
    energy: energy_max,
    health:  health_max,
  }
}

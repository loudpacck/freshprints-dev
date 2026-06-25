export const HEALTH_EFFECTS = new Set(['restore_health_pct', 'restore_health', 'restore_full'])
export const ENERGY_EFFECT = 'restore_energy_pct'

export function groupConsumables(inventory) {
  const map = new Map()
  for (const row of (inventory || [])) {
    if (row.slot !== 'consumable') continue
    if (!map.has(row.item_id)) {
      map.set(row.item_id, {
        item_id: row.item_id,
        name: row.name,
        rarity: row.rarity,
        effect: row.consumable_effect,
        count: 0,
      })
    }
    map.get(row.item_id).count++
  }
  return [...map.values()]
}

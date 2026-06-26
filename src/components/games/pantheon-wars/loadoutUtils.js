export const HEALTH_EFFECTS = new Set(['restore_health_pct', 'restore_health', 'restore_full'])
export const ENERGY_EFFECT = 'restore_energy_pct'

export function groupConsumables(inventory) {
  const map = new Map()
  for (const row of (inventory || [])) {
    if (row.slot !== 'consumable') continue
    if (!map.has(row.item_id)) {
      map.set(row.item_id, {
        item_id:           row.item_id,
        name:              row.name,
        rarity:            row.rarity,
        effect:            row.consumable_effect,  // loadout picker reads this field
        consumable_effect: row.consumable_effect,
        consumable_value:  row.consumable_value,
        description:       row.description,
        sell_price:        row.sell_price,
        count:             0,
        inventory_ids:     [],               // lowest id first after sort
      })
    }
    const grp = map.get(row.item_id)
    grp.count++
    grp.inventory_ids.push(row.inventory_id)
  }
  for (const grp of map.values()) {
    grp.inventory_ids.sort((a, b) => a - b)
  }
  return [...map.values()]
}

import { useState, useEffect, useCallback } from 'react'
import { groupConsumables, HEALTH_EFFECTS } from './loadoutUtils'

const GOLD = '#D8B24A'

const QTY_BTN = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4,
  color: '#F0F0F8',
  cursor: 'pointer',
  width: 26,
  height: 26,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 16,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

function LoadoutSlot({ label, color, items, selectedId, qty, onSelect, onQty }) {
  const selected = items.find(i => String(i.item_id) === String(selectedId))
  const maxAvail = selected?.count ?? 0

  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={selectedId ?? ''}
          onChange={e => { onSelect(e.target.value ? Number(e.target.value) : null); onQty(0) }}
          style={{
            flex: 1, minWidth: 150,
            background: 'rgba(20,16,28,0.8)', color: '#F0F0F8',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 5, padding: '7px 10px',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          }}
        >
          <option value="">— none —</option>
          {items.map(i => (
            <option key={i.item_id} value={i.item_id}>{i.label ?? `${i.name} ×${i.count}`}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            style={{ ...QTY_BTN, opacity: qty <= 0 ? 0.3 : 1, cursor: qty <= 0 ? 'not-allowed' : 'pointer' }}
            onClick={() => onQty(Math.max(0, qty - 1))}
            disabled={qty <= 0}
          >−</button>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color, width: 22, textAlign: 'center' }}>{qty}</span>
          <button
            style={{ ...QTY_BTN, opacity: (qty >= maxAvail || qty >= 10 || !selectedId) ? 0.3 : 1, cursor: (qty >= maxAvail || qty >= 10 || !selectedId) ? 'not-allowed' : 'pointer' }}
            onClick={() => onQty(Math.min(10, maxAvail, qty + 1))}
            disabled={qty >= maxAvail || qty >= 10 || !selectedId}
          >+</button>
        </div>
      </div>
    </div>
  )
}

export default function DungeonLoadoutPanel({ run, navigate, onRefetch, onToast }) {
  const isLocked = run.status !== 'forming'
  const bracket = run.dungeon?.bracket ?? 5

  const [inventory, setInventory]     = useState(null)
  const [healthItemId, setHealthItemId] = useState(run.viewer_loadout?.health_item_id ?? null)
  const [healthQty,    setHealthQty]    = useState(run.viewer_loadout?.health_qty ?? 0)
  const [energyItemId, setEnergyItemId] = useState(run.viewer_loadout?.energy_item_id ?? null)
  const [energyQty,    setEnergyQty]    = useState(run.viewer_loadout?.energy_qty ?? 0)
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Hydrate pickers from viewer_loadout on run change (e.g. after refetch)
  useEffect(() => {
    setHealthItemId(run.viewer_loadout?.health_item_id ?? null)
    setHealthQty(run.viewer_loadout?.health_qty ?? 0)
    setEnergyItemId(run.viewer_loadout?.energy_item_id ?? null)
    setEnergyQty(run.viewer_loadout?.energy_qty ?? 0)
  }, [run.viewer_loadout?.health_item_id, run.viewer_loadout?.health_qty, run.viewer_loadout?.energy_item_id, run.viewer_loadout?.energy_qty])

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=inventory')
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      const data = await res.json()
      setInventory(data.inventory || [])
    } catch {}
  }, [navigate])

  useEffect(() => {
    if (!isLocked) fetchInventory()
  }, [isLocked, fetchInventory])

  const consumables   = groupConsumables(inventory)
  const healthItems   = consumables.filter(c => HEALTH_EFFECTS.has(c.effect))
  const energyItems   = consumables.filter(c => c.effect === 'restore_energy_pct')

  // Merge reserved potions from viewer_loadout so the saved selection always
  // has a matching option even after reserve-at-save removes them from inventory.
  const vl = run.viewer_loadout
  const mergedHealthItems = [...healthItems]
  if (vl?.health_item_id && !mergedHealthItems.find(i => String(i.item_id) === String(vl.health_item_id))) {
    mergedHealthItems.push({
      item_id: vl.health_item_id,
      name: vl.health_item_name ?? 'Health Potion',
      count: vl.health_qty,
      label: `${vl.health_item_name ?? 'Health Potion'} ×${vl.health_qty} (reserved)`,
    })
  }
  const mergedEnergyItems = [...energyItems]
  if (vl?.energy_item_id && !mergedEnergyItems.find(i => String(i.item_id) === String(vl.energy_item_id))) {
    mergedEnergyItems.push({
      item_id: vl.energy_item_id,
      name: vl.energy_item_name ?? 'Energy Potion',
      count: vl.energy_qty,
      label: `${vl.energy_item_name ?? 'Energy Potion'} ×${vl.energy_qty} (reserved)`,
    })
  }

  const filledSlots   = run.party?.length ?? 0
  const nearFull      = filledSlots >= bracket - 1
  const hasLoadout    = (healthItemId && healthQty > 0) || (energyItemId && energyQty > 0)
  const showNudge     = !isLocked && nearFull && !hasLoadout

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_set_loadout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: run.run_id,
          health_item_id: healthItemId,
          health_qty: healthQty,
          energy_item_id: energyItemId,
          energy_qty: energyQty,
        }),
      })
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      const data = await res.json()
      if (!res.ok) {
        const msgMap = {
          insufficient_potions: "You don't have that many potions.",
          wrong_item_type: 'Wrong item type for that slot.',
          run_already_started: 'Run already started — loadout is locked.',
          invalid_loadout: 'Invalid loadout configuration.',
        }
        setSaveError(msgMap[data.error] || data.message || 'Failed to save loadout.')
        if (data.error === 'run_already_started') onRefetch()
        return
      }
      onToast('Loadout reserved.', '#22C55E')
      onRefetch()
      fetchInventory()
    } catch {
      setSaveError('Network error.')
    } finally {
      setSaving(false)
    }
  }

  if (isLocked) {
    const hl = run.viewer_loadout
    const hasAny = (hl?.health_qty > 0) || (hl?.energy_qty > 0)
    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.35)', marginBottom: 6 }}>
          LOADOUT
        </div>
        <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.45)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8, borderLeft: '2px solid rgba(216,178,74,0.4)', paddingLeft: 10, paddingTop: 3, paddingBottom: 3 }}>
          Loadout locked — dungeon starting.
        </div>
        {hasAny ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {hl.health_qty > 0 && (
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#22C55E' }}>
                ♥ {hl.health_item_name ?? 'Health Potion'} ×{hl.health_qty}
              </div>
            )}
            {hl.energy_qty > 0 && (
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#38BDF8' }}>
                ⚡ {hl.energy_item_name ?? 'Energy Potion'} ×{hl.energy_qty}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.25)' }}>
            No potions reserved.
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.35)', marginBottom: 6 }}>
        LOADOUT
      </div>

      {showNudge ? (
        <div style={{ border: '1px solid rgba(255,140,60,0.6)', background: 'rgba(255,140,60,0.08)', borderRadius: 6, padding: '10px 12px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>⚠</span>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(240,240,248,0.85)', lineHeight: 1.5 }}>
            Set your potions before the countdown starts — they lock in once the dungeon begins.
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.35)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 10, borderLeft: '2px solid rgba(216,178,74,0.3)', paddingLeft: 10 }}>
          Reserve your potions now — loadout locks when the party fills and the countdown begins.
        </div>
      )}

      {inventory === null ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.3)', marginBottom: 10 }}>
          Loading inventory…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
          <LoadoutSlot
            label="Health Potion"
            color="#22C55E"
            items={mergedHealthItems}
            selectedId={healthItemId}
            qty={healthQty}
            onSelect={setHealthItemId}
            onQty={setHealthQty}
          />
          <LoadoutSlot
            label="Energy Potion"
            color="#38BDF8"
            items={mergedEnergyItems}
            selectedId={energyItemId}
            qty={energyQty}
            onSelect={setEnergyItemId}
            onQty={setEnergyQty}
          />
        </div>
      )}

      {saveError && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F87171', marginBottom: 8 }}>
          {saveError}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || inventory === null}
        style={{
          width: '100%', padding: '10px',
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.1em',
          color: saving ? 'rgba(216,178,74,0.4)' : GOLD,
          background: 'none',
          border: `1px solid ${saving ? 'rgba(216,178,74,0.2)' : 'rgba(216,178,74,0.5)'}`,
          borderRadius: 6, cursor: (saving || inventory === null) ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'SAVING…' : 'SET LOADOUT'}
      </button>
    </div>
  )
}

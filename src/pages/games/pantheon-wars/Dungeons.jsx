import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'
import DungeonLoadoutPanel from '@/components/games/pantheon-wars/DungeonLoadoutPanel'
import DungeonRecapPanel from '@/components/games/pantheon-wars/DungeonRecapPanel'
import { useSound } from '@/sound/useSound'
import { groupConsumables, HEALTH_EFFECTS } from '@/components/games/pantheon-wars/loadoutUtils'

// ─── Constants ────────────────────────────────────────────────────────────────

const BRACKET_LABEL = { 2: '2-Man', 5: '5-Man', 10: '10-Man Raid' }
const DIFFICULTY_COLOR = { easy: '#6FCF6F', medium: '#E8C84B', hard: '#E0793C', expert: '#C2484B' }
const GOLD = '#D8B24A'
const GOLD_DIM = 'rgba(216,178,74,0.6)'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMs(ms) {
  const s   = Math.max(0, Math.floor(ms / 1000))
  const m   = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function fmtNum(n) { return Number(n || 0).toLocaleString() }

function useCountdown(targetIso) {
  const [display, setDisplay] = useState('--:--')
  useEffect(() => {
    if (!targetIso) { setDisplay('—'); return }
    function compute() { setDisplay(fmtMs(new Date(targetIso).getTime() - Date.now())) }
    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [targetIso])
  return display
}

function Skel({ h = 16, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, color, onDone }) {
  const { play } = useSound()
  useEffect(() => {
    if (color === '#22C55E') play('success')
    else if (color === '#F87171') play('error')
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 88px)', left: '50%', transform: 'translateX(-50%)',
        zIndex: 70,
        background: 'linear-gradient(180deg, var(--color-bg-elevated, #14101A), var(--color-bg-base, #0A0710))',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${color}`,
        borderRadius: 6, padding: '11px 22px',
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
        color, whiteSpace: 'nowrap',
      }}
    >
      {message}
    </motion.div>
  )
}

// ─── Dungeon Card ─────────────────────────────────────────────────────────────

function actionBtnStyle(disabled, color) {
  return {
    flex: 1, padding: '8px 10px',
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
    color: disabled ? 'rgba(240,240,248,0.2)' : color,
    background: 'none',
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : 'rgba(216,178,74,0.35)'}`,
    borderRadius: 5, cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

function MetaChip({ icon, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, color: '#9EC6DC',
      background: 'rgba(158,198,220,0.07)',
      border: '1px solid rgba(158,198,220,0.22)',
      borderRadius: 4, padding: '3px 8px',
      fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.02em',
    }}>
      <span style={{ opacity: 0.6 }}>{icon}</span>{label}
    </span>
  )
}

function GatingBadge({ icon, label, color, bg, border }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 700, color,
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 4, padding: '4px 10px',
      fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.03em',
    }}>
      {icon} {label}
    </span>
  )
}

function DungeonCard({ dungeon, playerLevel, onAutoQueue, onCreateGroup, busy }) {
  const diffColor = DIFFICULTY_COLOR[dungeon.difficulty] || '#A8A89C'
  const locked = Number(playerLevel) < Number(dungeon.level_required)
  const hasGating = dungeon.key_required || dungeon.alliance_required || dungeon.drops_key_item_name

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        border: '1px solid rgba(216,178,74,0.25)',
        background: 'rgba(20,16,28,0.55)',
        borderRadius: 6, padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#F0E6D2' }}>{dungeon.name}</span>
        <span style={{
          fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase',
          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
          color: diffColor, border: `1.5px solid ${diffColor}`, borderRadius: 3,
          padding: '3px 8px', whiteSpace: 'nowrap',
        }}>
          {dungeon.difficulty}
        </span>
      </div>

      {dungeon.description && (
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#B8B0A0' }}>{dungeon.description}</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <MetaChip icon="◈" label={BRACKET_LABEL[dungeon.bracket] || `${dungeon.bracket}-Man`} />
        <MetaChip icon="⬆" label={`Lvl ${dungeon.level_required}`} />
        <MetaChip icon="⚔" label={`${dungeon.encounter_count} encounters`} />
        {dungeon.treasury_cost > 0 && <MetaChip icon="₯" label={`${dungeon.treasury_cost} treasury`} />}
      </div>

      {hasGating && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {dungeon.key_required && (
            <GatingBadge
              icon="🔑"
              label={`Requires ${dungeon.key_item_name}`}
              color="#E8C84B"
              bg="rgba(216,178,74,0.13)"
              border="rgba(216,178,74,0.6)"
            />
          )}
          {dungeon.alliance_required && (
            <GatingBadge
              icon="⚜"
              label="Alliance Required"
              color="#F0F0F8"
              bg="rgba(255,255,255,0.06)"
              border="rgba(255,255,255,0.28)"
            />
          )}
          {dungeon.drops_key_item_name && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: '#A78BFA',
              border: '1px solid rgba(167,139,250,0.35)', borderRadius: 3,
              padding: '3px 8px', fontFamily: "'IBM Plex Mono', monospace",
            }}>
              ↓ Drops {dungeon.drops_key_item_name}
            </span>
          )}
        </div>
      )}

      {locked && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F87171' }}>
          Level {dungeon.level_required} required (you: {playerLevel})
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => onAutoQueue(dungeon.id)} disabled={locked || busy} style={actionBtnStyle(locked || busy, GOLD)}>
          AUTO-QUEUE
        </button>
        <button onClick={() => onCreateGroup(dungeon)} disabled={locked || busy} style={actionBtnStyle(locked || busy, 'rgba(240,240,248,0.55)')}>
          CREATE GROUP
        </button>
      </div>
    </motion.div>
  )
}

// ─── Create Group Modal ────────────────────────────────────────────────────────

function CreateGroupModal({ dungeon, onConfirm, onClose, busy }) {
  const [name, setName] = useState('')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,3,10,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.22 }}
        style={{ width: '100%', maxWidth: 380, background: 'var(--pw-bg-card, #1A1020)', border: '1px solid rgba(216,178,74,0.35)', borderRadius: 10, padding: '24px 20px' }}
      >
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.18em', color: GOLD, marginBottom: 8 }}>
          CREATE GROUP
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#F0E6D2', marginBottom: 16 }}>
          {dungeon.name}
        </div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && !busy && onConfirm(name.trim())}
          placeholder="Group name…"
          maxLength={40}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6, color: '#F0F0F8',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, marginBottom: 14,
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => name.trim() && !busy && onConfirm(name.trim())}
            disabled={!name.trim() || busy}
            style={{
              flex: 1, padding: '10px',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.1em',
              color: '#0F0A0D',
              background: busy || !name.trim() ? '#7A6B3A' : GOLD,
              border: 'none', borderRadius: 6, cursor: (busy || !name.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'CREATING…' : 'CREATE'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 14px',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              color: 'rgba(240,240,248,0.4)', background: 'none',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Group Browse Modal ────────────────────────────────────────────────────────

function GroupBrowseModal({ groups, loading, onJoin, onClose, busy }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,3,10,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.22 }}
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--pw-bg-card, #1A1020)',
          border: '1px solid rgba(216,178,74,0.3)', borderRadius: 12,
          maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: GOLD, letterSpacing: '0.18em' }}>OPEN GROUPS</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.4)', padding: '2px 8px' }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 20px' }}>
          {loading && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.35)' }}>Loading groups…</div>}
          {!loading && groups.length === 0 && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.25)', textAlign: 'center', padding: '20px 0' }}>
              No open groups at this time.
            </div>
          )}
          {!loading && groups.map(g => (
            <div key={g.run_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#F0E6D2', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.group_name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9A9286' }}>
                  {g.dungeon?.name} · {BRACKET_LABEL[g.dungeon?.bracket] || `${g.dungeon?.bracket}-Man`} · {g.member_count}/{g.max_members} · led by {g.leader_username}
                </div>
              </div>
              <button
                onClick={() => onJoin(g.run_id)}
                disabled={busy}
                style={{
                  padding: '7px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
                  color: busy ? GOLD_DIM : GOLD, background: 'none',
                  border: `1px solid ${busy ? 'rgba(216,178,74,0.2)' : 'rgba(216,178,74,0.5)'}`,
                  borderRadius: 5, cursor: busy ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                JOIN
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Party Slot List ──────────────────────────────────────────────────────────

const KICK_BTN = {
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.08em',
  color: '#F87171', background: 'none', border: '1px solid rgba(239,68,68,0.35)',
  borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
}

function PartySlotList({ run, viewerUserId, onVotekick, onGroupKick }) {
  const party     = run.party || []
  const bracket   = run.dungeon?.bracket ?? 5
  const votekicks = run.votekicks || []
  const isAuto    = run.formation_type === 'auto'
  const isForming = run.status === 'forming'
  const viewerRow = party.find(p => p.user_id === viewerUserId)

  const emptyCount = Math.max(0, bracket - party.length)

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', marginBottom: 8 }}>
        PARTY — {party.length}/{bracket}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {party.map(member => {
          const isViewer  = member.user_id === viewerUserId
          const vcEntry   = votekicks.find(v => v.target_user_id === member.user_id)
          const canVote   = isAuto && isForming && !isViewer
          const canKick   = !isAuto && isForming && viewerRow?.is_leader && !isViewer

          return (
            <div
              key={member.user_id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                padding: '8px 12px',
                background: isViewer ? 'rgba(216,178,74,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isViewer ? 'rgba(216,178,74,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 6,
              }}
            >
              {member.is_leader && <span style={{ fontSize: 11, color: GOLD, flexShrink: 0 }}>♛</span>}
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
                color: isViewer ? '#F0E6D2' : 'rgba(240,240,248,0.65)',
                flex: 1, minWidth: 80,
              }}>
                {member.username}
                {isViewer && <span style={{ fontSize: 9, color: GOLD_DIM, marginLeft: 8 }}>YOU</span>}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.3)' }}>
                Lvl {member.level ?? '?'}
              </span>
              {member.status === 'committed' && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 3, padding: '1px 5px' }}>
                  READY
                </span>
              )}
              {vcEntry && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#F87171' }}>
                  {vcEntry.votes}/{vcEntry.needed} votes
                </span>
              )}
              {canVote && <button style={KICK_BTN} onClick={() => onVotekick(member.user_id)}>KICK</button>}
              {canKick && <button style={KICK_BTN} onClick={() => onGroupKick(member.user_id)}>KICK</button>}
            </div>
          )
        })}

        {Array.from({ length: emptyCount }, (_, i) => (
          <div key={`empty-${i}`} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 6 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.18)', letterSpacing: '0.1em' }}>OPEN SLOT</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Browse Loadout Picker ────────────────────────────────────────────────────

const QTY_BTN_BROWSE = {
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4, color: '#F0F0F8', cursor: 'pointer',
  width: 24, height: 24, fontFamily: "'IBM Plex Mono', monospace", fontSize: 14,
  lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
}

function PickerSlot({ label, color, items, selectedId, qty, onSelect, onQty }) {
  const selected = items.find(i => String(i.item_id) === String(selectedId))
  const maxAvail = selected?.count ?? 0
  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={selectedId ?? ''}
          onChange={e => { onSelect(e.target.value ? Number(e.target.value) : null); onQty(0) }}
          style={{
            flex: 1, minWidth: 130,
            background: 'rgba(20,16,28,0.8)', color: '#F0F0F8',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 5, padding: '6px 9px',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          }}
        >
          <option value="">— none —</option>
          {items.map(i => (
            <option key={i.item_id} value={i.item_id}>{i.name} ×{i.count}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            style={{ ...QTY_BTN_BROWSE, opacity: qty <= 0 ? 0.3 : 1, cursor: qty <= 0 ? 'not-allowed' : 'pointer' }}
            onClick={() => onQty(Math.max(0, qty - 1))}
            disabled={qty <= 0}
          >−</button>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color, width: 20, textAlign: 'center' }}>{qty}</span>
          <button
            style={{ ...QTY_BTN_BROWSE, opacity: (qty >= maxAvail || qty >= 10 || !selectedId) ? 0.3 : 1, cursor: (qty >= maxAvail || qty >= 10 || !selectedId) ? 'not-allowed' : 'pointer' }}
            onClick={() => onQty(Math.min(10, maxAvail, qty + 1))}
            disabled={qty >= maxAvail || qty >= 10 || !selectedId}
          >+</button>
        </div>
      </div>
    </div>
  )
}

function BrowseLoadoutPicker({ inventory, pendingLoadout, onUpdate }) {
  const consumables = groupConsumables(inventory)
  const healthItems = consumables.filter(c => HEALTH_EFFECTS.has(c.effect))
  const energyItems = consumables.filter(c => c.effect === 'restore_energy_pct')
  const { healthItemId, healthQty, energyItemId, energyQty } = pendingLoadout

  if (inventory === null) return (
    <div style={{ border: '1px solid rgba(216,178,74,0.14)', borderRadius: 6, padding: '12px 14px', marginBottom: 18, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.3)' }}>
      Loading inventory…
    </div>
  )

  if (healthItems.length === 0 && energyItems.length === 0) return null

  return (
    <div style={{ border: '1px solid rgba(216,178,74,0.18)', background: 'rgba(20,16,28,0.5)', borderRadius: 6, padding: '14px 16px', marginBottom: 18 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD_DIM, marginBottom: 10 }}>
        POTION LOADOUT — NEXT RUN
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
        {healthItems.length > 0 && (
          <PickerSlot
            label="Health Potion"
            color="#22C55E"
            items={healthItems}
            selectedId={healthItemId}
            qty={healthQty}
            onSelect={id => onUpdate({ ...pendingLoadout, healthItemId: id, healthQty: 0 })}
            onQty={qty => onUpdate({ ...pendingLoadout, healthQty: qty })}
          />
        )}
        {energyItems.length > 0 && (
          <PickerSlot
            label="Energy Potion"
            color="#38BDF8"
            items={energyItems}
            selectedId={energyItemId}
            qty={energyQty}
            onSelect={id => onUpdate({ ...pendingLoadout, energyItemId: id, energyQty: 0 })}
            onQty={qty => onUpdate({ ...pendingLoadout, energyQty: qty })}
          />
        )}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.25)', letterSpacing: '0.04em' }}>
        Potions are reserved when your run begins.
      </div>
    </div>
  )
}

// ─── Browse View ──────────────────────────────────────────────────────────────

function BrowseView({ dungeons, dungeonsLoading, playerLevel, onAutoQueue, onCreateGroup, onBrowseGroups, busy, browseInventory, pendingLoadout, setPendingLoadout }) {
  return (
    <div>
      <BrowseLoadoutPicker inventory={browseInventory} pendingLoadout={pendingLoadout} onUpdate={setPendingLoadout} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#B8B0A0', maxWidth: 580 }}>
          Form a party and descend into instanced multi-encounter dungeons. Auto-queue fills your slot instantly; Create Group lets you hand-pick your crew.
        </p>
        <button
          onClick={onBrowseGroups}
          style={{
            padding: '8px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
            color: GOLD_DIM, background: 'none', border: '1px solid rgba(216,178,74,0.3)',
            borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          BROWSE OPEN GROUPS
        </button>
      </div>

      {dungeonsLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skel h={140} r={8} />
          <Skel h={140} r={8} />
        </div>
      )}

      {!dungeonsLoading && dungeons.length === 0 && (
        <p style={{ fontSize: 12, color: '#9A9286' }}>No dungeons available yet.</p>
      )}

      {!dungeonsLoading && dungeons.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 14 }}>
          {dungeons.map(d => (
            <DungeonCard
              key={d.id}
              dungeon={d}
              playerLevel={playerLevel}
              onAutoQueue={onAutoQueue}
              onCreateGroup={onCreateGroup}
              busy={busy}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── In-Progress View ─────────────────────────────────────────────────────────

function InProgressView({ run }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>⚔</div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px,6vw,28px)', color: DIFFICULTY_COLOR[run.dungeon?.difficulty] || GOLD, letterSpacing: '0.08em', marginBottom: 8 }}>
        FIGHT UNDERWAY
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'rgba(240,230,210,0.7)', marginBottom: 6 }}>
        {run.dungeon?.name}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.35)', letterSpacing: '0.1em' }}>
        {run.party?.length} WARRIORS DESCENDING
      </div>
    </div>
  )
}

// ─── Lobby View ───────────────────────────────────────────────────────────────

function LobbyView({ run, viewerUserId, onLeave, onVotekick, onGroupKick, onRefetch, onToast, navigate, busy }) {
  const isForming = run.status === 'forming'
  const countdown = useCountdown(run.starts_at)
  const bracket   = run.dungeon?.bracket ?? 5
  const diffColor = DIFFICULTY_COLOR[run.dungeon?.difficulty] || '#A8A89C'
  const isAuto    = run.formation_type === 'auto'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Dungeon header */}
      <div style={{ padding: '14px 16px', background: 'rgba(20,16,28,0.7)', border: '1px solid rgba(216,178,74,0.25)', borderRadius: 8, marginBottom: 16 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.14em', color: GOLD_DIM, textTransform: 'uppercase', marginBottom: 4 }}>
          {isAuto ? 'AUTO-QUEUE' : `GROUP · ${run.group_name}`} · {BRACKET_LABEL[bracket] || `${bracket}-Man`}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: '#F0E6D2', marginBottom: 4 }}>{run.dungeon?.name}</div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#9A9286', flexWrap: 'wrap' }}>
          <span style={{ color: diffColor }}>{run.dungeon?.difficulty}</span>
          <span>{run.dungeon?.encounter_count} encounters</span>
          <span>{run.party?.length}/{bracket} members</span>
        </div>
      </div>

      {/* Status / countdown */}
      {isForming ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'rgba(240,240,248,0.4)', textAlign: 'center', marginBottom: 16, letterSpacing: '0.1em' }}>
          WAITING FOR PARTY TO FILL…
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.16em', color: 'rgba(240,240,248,0.32)', textTransform: 'uppercase', marginBottom: 4 }}>
            DUNGEON STARTS IN
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 28, color: GOLD, letterSpacing: '0.08em' }}>
            {countdown}
          </div>
        </div>
      )}

      {/* Party slots */}
      <PartySlotList
        run={run}
        viewerUserId={viewerUserId}
        onVotekick={onVotekick}
        onGroupKick={onGroupKick}
      />

      {/* Loadout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
        <DungeonLoadoutPanel
          run={run}
          navigate={navigate}
          onRefetch={onRefetch}
          onToast={onToast}
        />
      </div>

      {/* Leave button — only while forming */}
      {isForming && (
        <button
          onClick={onLeave}
          disabled={busy}
          style={{
            marginTop: 18, width: '100%', padding: '10px',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.1em',
            color: busy ? 'rgba(239,68,68,0.3)' : '#EF4444',
            background: 'none', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6, cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'LEAVING…' : 'LEAVE DUNGEON'}
        </button>
      )}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dungeons() {
  const { user, stats, loading: authLoading } = usePantheonWars()
  const navigate = useNavigate()

  const [run,            setRun]            = useState(null)
  const [runLoading,     setRunLoading]     = useState(true)
  const [dungeons,       setDungeons]       = useState([])
  const [dungeonsLoading, setDungeonsLoading] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(null)
  const [showGroupBrowse, setShowGroupBrowse] = useState(false)
  const [groups,         setGroups]         = useState([])
  const [groupsLoading,  setGroupsLoading]  = useState(false)
  const [result,         setResult]         = useState(null)
  const [toast,          setToast]          = useState(null)
  const [actionBusy,     setActionBusy]     = useState(false)
  const [pendingLoadout, setPendingLoadout]  = useState({ healthItemId: null, healthQty: 0, energyItemId: null, energyQty: 0 })
  const [browseInventory, setBrowseInventory] = useState(null)

  const pollRef      = useRef(null)
  const prevStatusRef = useRef(null)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [authLoading, user, navigate])

  // Fetch current run
  const fetchMyRun = useCallback(async () => {
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_my_run')
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      const data = await res.json()
      const runValue = data.run ?? null
      setRun(runValue)
      return runValue
    } catch {} finally {
      setRunLoading(false)
    }
  }, [navigate])

  // Adaptive poll
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    const ms = run?.status === 'active'
      ? 2000
      : (run?.status === 'forming' || run?.status === 'starting')
        ? 4000
        : 15000
    pollRef.current = setInterval(fetchMyRun, ms)
    return () => clearInterval(pollRef.current)
  }, [run?.status, fetchMyRun])

  // Detect run-ended transition → fetch result
  const runStatus = run == null ? null : (run.status ?? null)
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    if ((prevStatus === 'active' || prevStatus === 'starting') && runStatus === null) {
      fetch('/api/games/pantheon-wars/game?action=dungeon_my_result')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.result) setResult(data.result) })
        .catch(() => {})
    }
    if (!runLoading) prevStatusRef.current = runStatus
  }, [runStatus, runLoading])

  // Fetch consumables for the browse-screen pre-equip picker; reset on run entry
  const isOnBrowse = !runLoading && run === null
  useEffect(() => {
    if (!isOnBrowse) { setBrowseInventory(null); return }
    fetch('/api/games/pantheon-wars/game?action=inventory')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBrowseInventory(data.inventory || []) })
      .catch(() => setBrowseInventory([]))
  }, [isOnBrowse])

  // Initial fetch + mount check for off-screen resolved run
  useEffect(() => {
    fetchMyRun().then(runValue => {
      // Only check when there's no live run — transition path handles the on-screen case
      if (runValue === null) {
        fetch('/api/games/pantheon-wars/game?action=dungeon_my_result')
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.result?.reward && !data.result.reward.acknowledged) {
              setResult(data.result)
            }
          })
          .catch(() => {})
      }
    })
    fetch('/api/games/pantheon-wars/game?action=dungeon_list')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setDungeons(data.dungeons || []) })
      .catch(() => {})
      .finally(() => setDungeonsLoading(false))
  }, [fetchMyRun])

  function showToast(message, color = GOLD) { setToast({ message, color }) }

  function handleResultClose() {
    const rewardId = result?.reward?.reward_id
    setResult(null)
    if (rewardId) {
      fetch('/api/games/pantheon-wars/game?action=acknowledge_reward', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_id: rewardId }),
      }).catch(() => {}) // best-effort
    }
  }

  async function applyPendingLoadout(runId) {
    const { healthItemId, healthQty, energyItemId, energyQty } = pendingLoadout
    if (!(healthItemId && healthQty > 0) && !(energyItemId && energyQty > 0)) return
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_set_loadout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId, health_item_id: healthItemId, health_qty: healthQty, energy_item_id: energyItemId, energy_qty: energyQty }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msgMap = {
          insufficient_potions: "Not enough potions for loadout — set it in the lobby.",
          run_already_started: 'Run started before loadout could be set.',
        }
        showToast(msgMap[data.error] || data.message || 'Loadout not applied — set it in the lobby.', '#F59E0B')
      }
    } catch {
      showToast('Loadout not applied — set it in the lobby.', '#F59E0B')
    }
  }

  // ── Action handlers ──────────────────────────────────────────────────────────

  async function handleAutoQueue(dungeonId) {
    setActionBusy(true)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_queue_join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dungeon_id: dungeonId }),
      })
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      const data = await res.json()
      if (res.ok && data.run) {
        setRun(data.run)
        showToast('Joined queue!', '#22C55E')
        applyPendingLoadout(data.run.run_id).then(fetchMyRun)
      } else {
        const msg = data.error === 'already_in_run' ? 'Already in a run.' : data.error === 'level_too_low' ? 'Level too low.' : data.message || data.error || 'Failed to join.'
        showToast(msg, '#F87171')
        if (data.error === 'already_in_run') fetchMyRun()
      }
    } catch {
      showToast('Network error.', '#F87171')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleCreateGroup(dungeonId, groupName) {
    setActionBusy(true)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_group_create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dungeon_id: dungeonId, group_name: groupName }),
      })
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      const data = await res.json()
      if (res.ok && data.run) {
        setRun(data.run)
        setShowCreateGroup(null)
        showToast('Group created!', '#22C55E')
        applyPendingLoadout(data.run.run_id).then(fetchMyRun)
      } else {
        showToast(data.message || data.error || 'Failed to create group.', '#F87171')
      }
    } catch {
      showToast('Network error.', '#F87171')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleJoinGroup(runId) {
    setActionBusy(true)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_group_join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId }),
      })
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      const data = await res.json()
      if (res.ok && data.run) {
        setRun(data.run)
        setShowGroupBrowse(false)
        showToast('Joined group!', '#22C55E')
        applyPendingLoadout(data.run.run_id).then(fetchMyRun)
      } else {
        showToast(data.message || data.error || 'Failed to join group.', '#F87171')
      }
    } catch {
      showToast('Network error.', '#F87171')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleLeave() {
    setActionBusy(true)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_leave', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: run.run_id }),
      })
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      if (res.ok) {
        setRun(null)
        showToast('Left dungeon.', GOLD)
      } else {
        const data = await res.json()
        showToast(data.message || data.error || 'Cannot leave at this stage.', '#F87171')
      }
    } catch {
      showToast('Network error.', '#F87171')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleVotekick(targetUserId) {
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_votekick', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: run.run_id, target_user_id: targetUserId }),
      })
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      const data = await res.json()
      if (!res.ok) { showToast(data.message || 'Vote failed.', '#F87171'); return }
      showToast(data.kicked ? 'Player kicked!' : `Vote cast (${data.votes}/${data.needed})`, GOLD)
      await fetchMyRun()
    } catch {
      showToast('Network error.', '#F87171')
    }
  }

  async function handleGroupKick(targetUserId) {
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_group_kick', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: run.run_id, target_user_id: targetUserId }),
      })
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      const data = await res.json()
      if (!res.ok) { showToast(data.message || 'Kick failed.', '#F87171'); return }
      showToast('Player kicked.', GOLD)
      await fetchMyRun()
    } catch {
      showToast('Network error.', '#F87171')
    }
  }

  async function handleBrowseGroups() {
    setGroupsLoading(true)
    setShowGroupBrowse(true)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_group_browse')
      const data = await res.json()
      setGroups(data.groups || [])
    } catch {} finally {
      setGroupsLoading(false)
    }
  }

  const playerLevel = stats?.level ?? 0

  return (
    <PWPageShell title="DUNGEONS" rightSlot={<PWBackButton />}>

      <AnimatePresence>
        {toast && <Toast message={toast.message} color={toast.color} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {runLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skel h={48} r={8} />
          <Skel h={140} r={8} />
          <Skel h={56} r={8} />
        </div>
      ) : run === null ? (
        <BrowseView
          dungeons={dungeons}
          dungeonsLoading={dungeonsLoading}
          playerLevel={playerLevel}
          onAutoQueue={handleAutoQueue}
          onCreateGroup={d => setShowCreateGroup(d)}
          onBrowseGroups={handleBrowseGroups}
          busy={actionBusy}
          browseInventory={browseInventory}
          pendingLoadout={pendingLoadout}
          setPendingLoadout={setPendingLoadout}
        />
      ) : run.status === 'active' ? (
        <InProgressView run={run} />
      ) : (
        <LobbyView
          run={run}
          viewerUserId={user?.id}
          onLeave={handleLeave}
          onVotekick={handleVotekick}
          onGroupKick={handleGroupKick}
          onRefetch={fetchMyRun}
          onToast={showToast}
          navigate={navigate}
          busy={actionBusy}
        />
      )}

      {/* Run recap — replaces simple ResultModal; acknowledge_reward fires on close via handleResultClose */}
      <AnimatePresence>
        {result && (
          <DungeonRecapPanel
            runId={result.run_id}
            result={result}
            onClose={handleResultClose}
          />
        )}
      </AnimatePresence>

      {/* Create Group modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <CreateGroupModal
            dungeon={showCreateGroup}
            onConfirm={name => handleCreateGroup(showCreateGroup.id, name)}
            onClose={() => setShowCreateGroup(null)}
            busy={actionBusy}
          />
        )}
      </AnimatePresence>

      {/* Group Browse modal */}
      <AnimatePresence>
        {showGroupBrowse && (
          <GroupBrowseModal
            groups={groups}
            loading={groupsLoading}
            onJoin={handleJoinGroup}
            onClose={() => setShowGroupBrowse(false)}
            busy={actionBusy}
          />
        )}
      </AnimatePresence>

    </PWPageShell>
  )
}

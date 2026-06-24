import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'

// ─── Constants ────────────────────────────────────────────────────────────────

const BRACKET_LABEL = { 2: '2-Man', 5: '5-Man', 10: '10-Man Raid' }

const DIFFICULTY_COLOR = {
  easy:   '#6FCF6F',
  medium: '#E8C84B',
  hard:   '#E0793C',
  expert: '#C2484B',
}

// ─── Dungeon card ───────────────────────────────────────────────────────────────

function DungeonCard({ dungeon }) {
  const diffColor = DIFFICULTY_COLOR[dungeon.difficulty] || '#A8A89C'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        border: '1px solid rgba(216,178,74,0.25)',
        background: 'rgba(20,16,28,0.55)',
        borderRadius: 6,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#F0E6D2' }}>{dungeon.name}</span>
        <span style={{
          fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase',
          color: diffColor, border: `1px solid ${diffColor}`, borderRadius: 3,
          padding: '2px 6px', whiteSpace: 'nowrap',
        }}>
          {dungeon.difficulty}
        </span>
      </div>

      {dungeon.description && (
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#B8B0A0' }}>
          {dungeon.description}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: '#9A9286', marginTop: 4 }}>
        <span>◈ {BRACKET_LABEL[dungeon.bracket] || `${dungeon.bracket}-Man`}</span>
        <span>⬆ Lvl {dungeon.level_required}</span>
        <span>{dungeon.encounter_count} encounters</span>
        {dungeon.treasury_cost > 0 && <span>₯ {dungeon.treasury_cost} treasury</span>}
        {dungeon.key_required && <span style={{ color: '#D8B24A' }}>🗝 Key required</span>}
        {dungeon.alliance_required && <span style={{ color: '#FFFFFF' }}>⚜ Alliance only</span>}
      </div>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Dungeons() {
  const { user, loading: authLoading } = usePantheonWars()
  const navigate = useNavigate()

  const [dungeons, setDungeons] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [authLoading, user, navigate])

  const fetchDungeons = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=dungeon_list')
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      if (!res.ok) { setError('Failed to load dungeons.'); return }
      const data = await res.json()
      setDungeons(data.dungeons || [])
    } catch { setError('Network error.') }
    finally   { setLoading(false) }
  }, [navigate])

  useEffect(() => { fetchDungeons() }, [fetchDungeons])

  return (
    <PWPageShell title="DUNGEONS" rightSlot={<PWBackButton />}>

      <p style={{ fontSize: 12, lineHeight: 1.6, color: '#B8B0A0', marginTop: 0, marginBottom: 18, maxWidth: 640 }}>
        Form a party and descend into instanced multi-encounter dungeons for drachma, gear, and contested boss loot.
        Party formation, loadouts, and live runs are <strong style={{ color: '#D8B24A' }}>coming soon</strong>.
      </p>

      {loading && (
        <p style={{ fontSize: 12, color: '#9A9286' }}>Loading dungeons…</p>
      )}

      {error && (
        <p style={{ fontSize: 12, color: '#C2484B' }}>{error}</p>
      )}

      {!loading && !error && dungeons.length === 0 && (
        <p style={{ fontSize: 12, color: '#9A9286' }}>No dungeons are available yet.</p>
      )}

      {!loading && !error && dungeons.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
          gap: 14,
        }}>
          {dungeons.map(d => <DungeonCard key={d.id} dungeon={d} />)}
        </div>
      )}

    </PWPageShell>
  )
}

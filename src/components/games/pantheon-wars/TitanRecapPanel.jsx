import { useState, useEffect } from 'react'
import TitanPlayerLogModal from './TitanPlayerLogModal'

const GOLD        = '#C9A961'
const GOLD_BRIGHT = '#EDE3CC'

const FACTION_COLOR = { olympians: '#E8D080', aesir: '#8AB8D4', annunaki: '#C25E3C' }

const DIFF_COLOR = { medium: '#3B82F6', hard: '#F97316', extreme: '#EF4444' }

const RANK_BADGE = {
  1: { label: '1st', bg: 'rgba(201,169,97,0.25)', border: '#C9A961',  color: GOLD_BRIGHT },
  2: { label: '2nd', bg: 'rgba(156,163,175,0.2)', border: '#9CA3AF',  color: '#D1D5DB' },
  3: { label: '3rd', bg: 'rgba(180,100,60,0.2)',  border: '#CD7F32',  color: '#E09060' },
}

const MONO  = "'IBM Plex Mono', monospace"
const CINZEL = "'Cinzel', serif"
const DM    = "'DM Sans', sans-serif"
const BEBAS = "'Bebas Neue', sans-serif"

function AbilityCard({ icon, label, children }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'rgba(201,169,97,0.06)',
      border: '1px solid rgba(201,169,97,0.2)',
      borderRadius: 6,
      marginBottom: 6,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.4)', letterSpacing: '0.14em', marginBottom: 4 }}>
        {icon} ABILITY HIGHLIGHT
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: GOLD, letterSpacing: '0.06em' }}>
        {label}
      </div>
      {children && (
        <div style={{ fontFamily: DM, fontSize: 12, color: 'rgba(240,240,248,0.55)', marginTop: 4 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function AbilityHighlights({ highlights, abilityType }) {
  const keys = Object.keys(highlights)
  if (!keys.length) return null

  const cards = []

  if (highlights.ragnarok_flame) {
    const h = highlights.ragnarok_flame
    if (h.fired) {
      cards.push(
        <AbilityCard key="rag" icon="🔥" label={`RAGNAROK FIRED at round ${h.round} — ${h.total_aoe_damage} AoE damage to all warriors`} />
      )
    } else {
      cards.push(
        <AbilityCard key="rag" icon="🔥" label="RAGNAROK — HP threshold never reached, flames held" />
      )
    }
  }

  if (highlights.time_warp) {
    const h = highlights.time_warp
    cards.push(
      <AbilityCard key="tw" icon="⏳" label={`TIME DILATION — ${h.total_turns_lost} player-turn${h.total_turns_lost !== 1 ? 's' : ''} lost to chronal freeze`} />
    )
  }

  if (highlights.death_aura) {
    const h = highlights.death_aura
    cards.push(
      <AbilityCard key="da" icon="💀" label={`DEATH AURA — ${h.total_hp_drained} total HP drained across all warriors`}>
        (computed from rounds 2+; slight undercount due to HP floor)
      </AbilityCard>
    )
  }

  if (highlights.divine_storm) {
    const h = highlights.divine_storm
    cards.push(
      <AbilityCard key="ds" icon="⚡" label={`DIVINE STORM — ${h.total_energy_drained} total energy drained (${h.players_fatigued} warrior${h.players_fatigued !== 1 ? 's' : ''} fatigued)`} />
    )
  }

  if (highlights.chaos_surge) {
    cards.push(
      <AbilityCard key="cs" icon="🌀" label="CHAOS SURGE — active during combat, unpredictable power spikes">
        {highlights.chaos_surge.ability_description}
      </AbilityCard>
    )
  }

  for (const key of ['crushing_weight', 'arcane_disrupt', 'frost_veil']) {
    if (highlights[key]) {
      const h = highlights[key]
      cards.push(
        <AbilityCard key={key} icon="🛡" label={`${(h.ability_name || key).toUpperCase()} — active`}>
          {h.ability_description}
        </AbilityCard>
      )
    }
  }

  if (!cards.length) return null

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.16em', marginBottom: 8 }}>
        ABILITY HIGHLIGHTS
      </div>
      {cards}
    </div>
  )
}

export default function TitanRecapPanel({ eventId }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [logTarget, setLogTarget] = useState(null) // { userId, username }

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    fetch(`/api/games/pantheon-wars/game?action=titan_recap&event_id=${eventId}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.1em' }}>
        LOADING BATTLE DATA…
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: '16px 0', textAlign: 'center', fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.25)' }}>
        Battle data unavailable.
      </div>
    )
  }

  const { event, titan, participants, ability_highlights, total_participants } = data
  const isVictory = event.result === 'victory'
  const resultColor = isVictory ? '#22C55E' : '#EF4444'
  const diffColor   = DIFF_COLOR[titan.difficulty] || '#9CA3AF'

  const hpPct = event.titan_starting_hp > 0
    ? Math.max(0, Math.min(100, (event.titan_final_hp / event.titan_starting_hp) * 100))
    : 0

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontFamily: CINZEL, fontSize: 17, color: GOLD_BRIGHT, letterSpacing: '0.08em' }}>
            {titan.name}
          </span>
          <span style={{
            fontFamily: MONO, fontSize: 9, color: diffColor,
            border: `1px solid ${diffColor}55`, borderRadius: 3,
            padding: '2px 6px', letterSpacing: '0.12em',
          }}>
            {titan.difficulty.toUpperCase()}
          </span>
          <span style={{
            fontFamily: MONO, fontSize: 9, color: resultColor,
            border: `1px solid ${resultColor}55`, borderRadius: 3,
            padding: '2px 6px', letterSpacing: '0.12em',
          }}>
            {isVictory ? 'VICTORY' : 'DEFEAT'}
          </span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(240,240,248,0.4)', letterSpacing: '0.1em' }}>
          {total_participants} WARRIOR{total_participants !== 1 ? 'S' : ''} · {event.rounds_count} ROUND{event.rounds_count !== 1 ? 'S' : ''}
          {event.safety_cap_reached && <span style={{ color: '#F59E0B', marginLeft: 8 }}>· SAFETY CAP REACHED</span>}
        </div>
      </div>

      {/* Titan HP bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.14em', marginBottom: 5 }}>
          TITAN HP
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${hpPct}%`,
            background: isVictory ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.8)',
            borderRadius: 4,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 10, color: isVictory ? '#22C55E' : '#EF4444', letterSpacing: '0.1em' }}>
          {isVictory
            ? '✓ SLAIN'
            : `SURVIVED — ${event.titan_final_hp.toLocaleString()} HP remaining`}
        </div>
      </div>

      {/* Participants table */}
      {participants.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.14em', marginBottom: 6 }}>
            WARRIORS
          </div>

          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 60px 64px 48px 44px',
            gap: 4,
            padding: '4px 6px',
            fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.28)', letterSpacing: '0.1em',
          }}>
            <div></div>
            <div>NAME</div>
            <div style={{ textAlign: 'right' }}>DMG</div>
            <div style={{ textAlign: 'right' }}>HP LOST</div>
            <div style={{ textAlign: 'right' }}>FINAL</div>
            <div style={{ textAlign: 'center' }}>TIER</div>
          </div>

          {participants.map((p, idx) => {
            const badge   = RANK_BADGE[p.contribution_rank]
            const fColor  = FACTION_COLOR[p.faction] ?? '#F0F0F8'
            const isTop   = p.reward_tier === 'top'

            return (
              <div
                key={p.user_id}
                onClick={() => setLogTarget({ userId: p.user_id, username: p.username })}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr 60px 64px 48px 44px',
                  gap: 4,
                  padding: '6px 6px',
                  alignItems: 'center',
                  borderRadius: 5,
                  marginBottom: 2,
                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,97,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
              >
                {/* Rank badge */}
                <div>
                  {badge ? (
                    <span style={{
                      fontFamily: MONO, fontSize: 8,
                      color: badge.color, background: badge.bg,
                      border: `1px solid ${badge.border}55`,
                      borderRadius: 3, padding: '1px 3px', letterSpacing: '0.05em',
                    }}>
                      {badge.label}
                    </span>
                  ) : (
                    <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.2)' }}>
                      #{idx + 1}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div>
                  <span style={{ fontFamily: DM, fontSize: 12, color: '#F0F0F8' }}>{p.username}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: fColor, marginLeft: 5, opacity: 0.7 }}>
                    {p.faction}
                  </span>
                </div>

                {/* Damage */}
                <div style={{ textAlign: 'right', fontFamily: BEBAS, fontSize: 14, color: '#F87171', letterSpacing: '0.04em' }}>
                  {p.damage_dealt.toLocaleString()}
                </div>

                {/* HP lost */}
                <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 10, color: 'rgba(240,240,248,0.45)' }}>
                  {p.hp_lost.toLocaleString()}
                </div>

                {/* Final HP */}
                <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 10, color: p.final_hp <= 1 ? '#EF4444' : '#22C55E' }}>
                  {p.final_hp}
                </div>

                {/* Reward tier */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 8, letterSpacing: '0.08em',
                    color: isTop ? GOLD : 'rgba(240,240,248,0.35)',
                    border: `1px solid ${isTop ? GOLD + '55' : 'rgba(240,240,248,0.1)'}`,
                    borderRadius: 3, padding: '1px 4px',
                  }}>
                    {isTop ? 'TOP' : 'BASE'}
                  </span>
                </div>
              </div>
            )
          })}

          <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.2)', marginTop: 6, letterSpacing: '0.08em' }}>
            Click a warrior to view their combat log →
          </div>
        </div>
      )}

      {/* Ability highlights */}
      <AbilityHighlights highlights={ability_highlights} abilityType={titan.ability_name} />

      {/* Per-player log modal */}
      {logTarget && (
        <TitanPlayerLogModal
          eventId={eventId}
          userId={logTarget.userId}
          username={logTarget.username}
          onClose={() => setLogTarget(null)}
        />
      )}
    </>
  )
}

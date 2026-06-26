import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DungeonPlayerLogModal from './DungeonPlayerLogModal'

const GOLD        = '#D8B24A'
const GOLD_BRIGHT = '#EDE3CC'
const MONO        = "'IBM Plex Mono', monospace"
const CINZEL      = "'Cinzel', serif"
const DM          = "'DM Sans', sans-serif"
const BEBAS       = "'Bebas Neue', sans-serif"

const BRACKET_LABEL    = { 2: '2-Man', 5: '5-Man', 10: '10-Man Raid' }
const DIFFICULTY_COLOR = { easy: '#6FCF6F', medium: '#E8C84B', hard: '#E0793C', expert: '#C2484B' }
const RARITY_COLOR     = { common: '#9CA3AF', uncommon: '#22C55E', rare: '#3B82F6', epic: '#A855F7', legendary: '#F59E0B' }
const FACTION_COLOR    = { olympians: '#E8D080', aesir: '#8AB8D4', annunaki: '#C25E3C' }

function fmtNum(n) { return Number(n || 0).toLocaleString() }

function Skel({ h = 16, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

// ── Encounter progression pip strip ──────────────────────────────────────────

function ProgressionStrip({ encounterCount, encountersCleared, outcome, encounters }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap' }}>
      {Array.from({ length: encounterCount }, (_, i) => {
        const isCleared = i < encountersCleared
        const isWipe    = outcome === 'wipe' && i === encountersCleared
        const enc       = encounters[i]
        const label     = enc?.name ? enc.name.slice(0, 10) : `${i + 1}`

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 5,
              background: isWipe ? 'rgba(239,68,68,0.15)' : isCleared ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isWipe ? 'rgba(239,68,68,0.5)' : isCleared ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
              color: isWipe ? '#EF4444' : isCleared ? '#22C55E' : 'rgba(240,240,248,0.15)',
            }}>
              {isWipe ? '✗' : isCleared ? '✓' : '○'}
            </div>
            <span style={{
              fontFamily: MONO, fontSize: 7, letterSpacing: '0.04em',
              color: isWipe ? '#EF4444' : isCleared ? 'rgba(34,197,94,0.6)' : 'rgba(240,240,248,0.18)',
              maxWidth: 40, textAlign: 'center',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Per sub-fight row within an encounter section ────────────────────────────

function SubFightRow({ sf, isWipeEnc }) {
  const isDead = sf.result !== 'victory'
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
      padding: '6px 10px',
      background: isWipeEnc && isDead ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${isWipeEnc && isDead ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 5, marginBottom: 4,
    }}>
      <span style={{ fontFamily: DM, fontSize: 13, color: '#F0E6D2', flex: 1, minWidth: 80 }}>
        {sf.enemy?.name || `Enemy ${sf.sub_fight}`}
      </span>

      {sf.enemy && (
        <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.35)', letterSpacing: '0.04em' }}>
          {fmtNum(sf.enemy.starting_hp)} → {fmtNum(sf.enemy.final_hp)} HP
        </span>
      )}

      <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.28)' }}>
        {sf.rounds_count} rd{sf.rounds_count !== 1 ? 's' : ''}
      </span>

      <span style={{
        fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em',
        color: isDead ? '#EF4444' : '#22C55E',
        border: `1px solid ${isDead ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
        borderRadius: 3, padding: '1px 5px',
      }}>
        {isDead ? 'WIPED' : 'SLAIN'}
      </span>
    </div>
  )
}

// ── Encounter section ─────────────────────────────────────────────────────────

function EncounterSection({ enc, isWipeEnc }) {
  return (
    <div style={{
      borderRadius: 7,
      border: `1px solid ${isWipeEnc ? 'rgba(239,68,68,0.28)' : 'rgba(255,255,255,0.08)'}`,
      background: isWipeEnc ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.01)',
      padding: '12px 14px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{
          fontFamily: DM, fontSize: 14, fontWeight: 700,
          color: isWipeEnc ? '#F87171' : GOLD_BRIGHT,
          flex: 1, minWidth: 80,
        }}>
          {enc.name || `Encounter ${enc.encounter_index}`}
        </span>

        {enc.encounter_type && (
          <span style={{
            fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em',
            color: 'rgba(240,240,248,0.3)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 5px',
          }}>
            {enc.encounter_type.toUpperCase()}
          </span>
        )}

        {enc.enemy_count > 1 && (
          <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(240,240,248,0.3)' }}>
            {enc.enemy_count} enemies
          </span>
        )}

        {isWipeEnc && (
          <span style={{
            fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em',
            color: '#EF4444',
            border: '1px solid rgba(239,68,68,0.35)', borderRadius: 3, padding: '1px 5px',
          }}>
            WIPE
          </span>
        )}
      </div>

      {enc.sub_fights.map(sf => (
        <SubFightRow key={sf.sub_fight} sf={sf} isWipeEnc={isWipeEnc} />
      ))}
    </div>
  )
}

// ── Party table ───────────────────────────────────────────────────────────────
// Sorted by damage_dealt DESC (backend already sorts this way).
// Click a row → open combat log for that member at the last/wipe encounter.
// encounterArrIdx = 0-based array index, which is what dungeon_player_log expects.

function PartyTable({ party, recap, onOpenLog }) {
  // Default log target: wipe encounter (array index = encounters_cleared) or last encounter
  const defaultEncArrIdx = recap.outcome === 'wipe'
    ? Math.min(recap.encounters_cleared, recap.encounters.length - 1)
    : recap.encounters.length - 1

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.14em', marginBottom: 6 }}>
        PARTY
      </div>

      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 36px 52px 60px 64px',
        gap: 4, padding: '4px 6px',
        fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.28)', letterSpacing: '0.08em',
      }}>
        <div></div>
        <div>NAME</div>
        <div style={{ textAlign: 'right' }}>LVL</div>
        <div style={{ textAlign: 'right' }}>HP</div>
        <div style={{ textAlign: 'right' }}>DMG</div>
        <div style={{ textAlign: 'right' }}>POTIONS</div>
      </div>

      {party.map((p, idx) => (
        <div
          key={p.user_id}
          onClick={() => onOpenLog({ userId: p.user_id, username: p.username, encounterArrIdx: defaultEncArrIdx, subFight: 1 })}
          style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 36px 52px 60px 64px',
            gap: 4, padding: '6px 6px',
            alignItems: 'center',
            borderRadius: 5, marginBottom: 2,
            background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(216,178,74,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
        >
          {/* Rank */}
          <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.25)' }}>
            #{idx + 1}
          </div>

          {/* Name + faction */}
          <div>
            <span style={{ fontFamily: DM, fontSize: 12, color: '#F0F0F8' }}>{p.username}</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: FACTION_COLOR[p.faction] ?? '#F0F0F8', marginLeft: 5, opacity: 0.65 }}>
              {p.faction}
            </span>
          </div>

          {/* Level */}
          <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 10, color: 'rgba(240,240,248,0.4)' }}>
            {p.level}
          </div>

          {/* Final HP */}
          <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 10, color: p.final_hp <= 1 ? '#EF4444' : '#22C55E' }}>
            {fmtNum(p.final_hp)}
          </div>

          {/* Damage */}
          <div style={{ textAlign: 'right', fontFamily: BEBAS, fontSize: 14, color: '#F87171', letterSpacing: '0.04em' }}>
            {fmtNum(p.damage_dealt)}
          </div>

          {/* Potions used: H + E */}
          <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.35)' }}>
            H:{p.potions_used_health} E:{p.potions_used_energy}
          </div>
        </div>
      ))}

      <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.2)', marginTop: 6, letterSpacing: '0.08em' }}>
        Click a member to view their combat log →
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
// Props:
//   runId   — from result.run_id (dungeon_my_result)
//   result  — full result object from dungeon_my_result (carries reward + dungeon meta)
//   onClose — fires acknowledge_reward in parent (Dungeons.jsx handleResultClose)

export default function DungeonRecapPanel({ runId, result, onClose }) {
  const [recap,     setRecap]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [logTarget, setLogTarget] = useState(null) // { userId, username, encounterArrIdx, subFight }

  const isVictory = result?.outcome === 'victory'
  const reward    = result?.reward?.payload
  const diffColor = DIFFICULTY_COLOR[result?.dungeon?.difficulty] || '#A8A89C'

  useEffect(() => {
    if (!runId) { setLoading(false); return }
    setLoading(true)
    fetch(`/api/games/pantheon-wars/game?action=dungeon_recap&run_id=${runId}`)
      .then(r => r.json())
      .then(d => { if (d.recap) setRecap(d.recap) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [runId])

  // Escape closes recap when no log is open; DungeonPlayerLogModal handles its own Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && !logTarget) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, logTarget])

  const dungeonName = recap?.dungeon?.name || result?.dungeon?.name || '—'
  const bracket     = recap?.dungeon?.bracket ?? result?.dungeon?.bracket
  const outcome     = recap?.outcome || result?.outcome || 'wipe'

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget && !logTarget) onClose() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(5,3,10,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px 12px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%', maxWidth: 660,
            background: 'var(--pw-bg-card, #1A1020)',
            border: `1px solid ${isVictory ? 'rgba(216,178,74,0.45)' : 'rgba(239,68,68,0.35)'}`,
            borderRadius: 12,
            maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header bar */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0, flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: CINZEL, fontSize: 17, color: isVictory ? GOLD_BRIGHT : '#F87171', letterSpacing: '0.1em' }}>
                {isVictory ? 'VICTORY' : 'WIPE'}
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em',
                color: diffColor, border: `1px solid ${diffColor}55`, borderRadius: 3, padding: '2px 6px',
              }}>
                {(result?.dungeon?.difficulty || '').toUpperCase()}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(240,240,248,0.4)' }}>
                {dungeonName}
                {bracket ? ` · ${BRACKET_LABEL[bracket] || `${bracket}-Man`}` : ''}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.35)', padding: '4px 8px', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '20px 20px 24px' }}>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skel h={44} r={8} />
                <Skel h={90} r={8} />
                <Skel h={90} r={8} />
                <Skel h={130} r={8} />
              </div>
            ) : !recap ? (
              <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.3)', textAlign: 'center', padding: '24px 0' }}>
                Run detail unavailable.
              </div>
            ) : (
              <>
                {/* Wipe note */}
                {outcome === 'wipe' && recap.wiped_at_encounter != null && (
                  <div style={{ fontFamily: MONO, fontSize: 10, color: '#F87171', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Wiped at encounter {recap.wiped_at_encounter}
                  </div>
                )}

                {/* Encounter progression strip */}
                <ProgressionStrip
                  encounterCount={recap.encounter_count}
                  encountersCleared={recap.encounters_cleared}
                  outcome={outcome}
                  encounters={recap.encounters}
                />

                {/* Per-encounter sections */}
                <div style={{ marginBottom: 18 }}>
                  {recap.encounters.map((enc, arrIdx) => {
                    const isWipeEnc = outcome === 'wipe' && arrIdx === recap.encounters_cleared
                    return (
                      <EncounterSection key={enc.encounter_index ?? arrIdx} enc={enc} isWipeEnc={isWipeEnc} />
                    )
                  })}
                </div>

                {/* Party table */}
                {recap.party.length > 0 && (
                  <PartyTable party={recap.party} recap={recap} onOpenLog={setLogTarget} />
                )}
              </>
            )}

            {/* Rewards — always shown from result prop, independent of recap fetch */}
            {reward && (reward.drachma > 0 || reward.items?.length > 0 || reward.key_item_id) && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(216,178,74,0.06)',
                border: '1px solid rgba(216,178,74,0.25)',
                borderRadius: 6, marginBottom: 16,
                marginTop: loading || !recap ? 16 : 0,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                  ★ REWARDS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {reward.drachma > 0 && (
                    <div style={{ fontFamily: MONO, fontSize: 12, color: GOLD }}>₯ +{fmtNum(reward.drachma)} Drachma</div>
                  )}
                  {(reward.items || []).map((item, i) => (
                    <div key={i} style={{ fontFamily: MONO, fontSize: 12, color: '#F0E6D2', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{item.name || 'Item'}</span>
                      {item.rarity && (
                        <span style={{ fontSize: 9, color: RARITY_COLOR[item.rarity] || '#9CA3AF', letterSpacing: '0.08em' }}>
                          {item.rarity.toUpperCase()}
                        </span>
                      )}
                      {item.id === reward.contested_item_id && (
                        <span style={{ fontSize: 9, color: '#F59E0B', letterSpacing: '0.08em' }}>★ CONTESTED WIN</span>
                      )}
                    </div>
                  ))}
                  {reward.key_item_id && (
                    <div style={{ fontFamily: MONO, fontSize: 12, color: GOLD }}>🗝 Key received</div>
                  )}
                </div>
              </div>
            )}

            {/* CONTINUE */}
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '12px',
                fontFamily: CINZEL, fontSize: 13, letterSpacing: '0.1em',
                color: 'rgba(240,240,248,0.6)', background: 'none',
                border: '1px solid rgba(240,240,248,0.12)', borderRadius: 6, cursor: 'pointer',
              }}
            >
              CONTINUE
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Per-player combat log — z-index 300, above the recap panel */}
      <AnimatePresence>
        {logTarget && (
          <DungeonPlayerLogModal
            runId={runId}
            userId={logTarget.userId}
            username={logTarget.username}
            encounterIndex={logTarget.encounterArrIdx}
            subFight={logTarget.subFight}
            onClose={() => setLogTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

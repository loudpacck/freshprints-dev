import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSound } from '@/sound/useSound'

const RARITY_COLOR = {
  common:    '#A0A0B8',
  uncommon:  '#22C55E',
  rare:      '#8BBECC',
  epic:      '#A78BFA',
  legendary: '#F5D88B',
}

const GOLD        = '#C9A961'
const GOLD_BRIGHT = '#F5D88B'

function fmt(n) { return Number(n).toLocaleString() }

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }
const fadeUp  = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function AdventureRewardModal({ reward, onClose }) {
  const { play } = useSound()
  const payload = reward.payload ?? reward

  useEffect(() => {
    play('adventure_return')
    if (payload.loot) {
      const snd = ['rare', 'epic', 'legendary'].includes(payload.loot.rarity) ? 'rare_loot' : 'loot_drop'
      setTimeout(() => play(snd), 350)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(5,3,10,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--pw-bg-card, #1A1020)',
          border: `1px solid ${GOLD}55`,
          borderRadius: 12,
          padding: '28px 24px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>⚑</div>
          <div style={{
            fontFamily: "var(--pw-font-display, 'Cinzel', serif)",
            fontSize: 22,
            letterSpacing: '0.1em',
            color: GOLD_BRIGHT,
            marginBottom: 5,
          }}>
            ADVENTURE COMPLETE
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: `${GOLD}99`,
          }}>
            {payload.adventure_name}
          </div>
        </div>

        {/* Rewards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}
        >
          {payload.xp > 0 && (
            <motion.div variants={fadeUp} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px',
              background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6,
            }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.55)', letterSpacing: '0.1em' }}>
                EXPERIENCE
              </span>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#A78BFA', letterSpacing: '0.06em' }}>
                +{fmt(payload.xp)} XP
              </span>
            </motion.div>
          )}

          {payload.drachma > 0 && (
            <motion.div variants={fadeUp} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px',
              background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)', borderRadius: 6,
            }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.55)', letterSpacing: '0.1em' }}>
                DRACHMA
              </span>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: GOLD, letterSpacing: '0.06em' }}>
                +{fmt(payload.drachma)} ₯
              </span>
            </motion.div>
          )}

          {payload.loot && (
            <motion.div variants={fadeUp} style={{
              padding: '10px 14px',
              background: 'rgba(245,158,11,0.06)',
              border: `1px solid ${RARITY_COLOR[payload.loot.rarity] || '#9CA3AF'}44`,
              borderRadius: 6,
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(240,240,248,0.35)', marginBottom: 5,
              }}>
                LOOT RECEIVED
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: GOLD_BRIGHT }}>
                  {payload.loot.name}
                </span>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: RARITY_COLOR[payload.loot.rarity] || '#9CA3AF',
                  letterSpacing: '0.08em',
                }}>
                  {payload.loot.rarity?.toUpperCase()}
                </span>
              </div>
            </motion.div>
          )}

          {payload.levelsGained > 0 && (
            <motion.div variants={fadeUp} style={{
              textAlign: 'center', padding: '12px 14px',
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 6,
            }}>
              <div style={{
                fontFamily: "var(--pw-font-display, 'Cinzel', serif)",
                fontSize: 20, letterSpacing: '0.1em', color: '#D4A437',
              }}>
                ★ LEVEL UP{payload.levelsGained > 1 ? ` ×${payload.levelsGained}` : ''}!
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Claim button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          style={{
            width: '100%',
            padding: '13px',
            fontFamily: "var(--pw-font-display, 'Cinzel', serif)",
            fontSize: 13,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#0A0710',
            background: `linear-gradient(135deg, ${GOLD}, #B08840)`,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          CLAIM REWARDS
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

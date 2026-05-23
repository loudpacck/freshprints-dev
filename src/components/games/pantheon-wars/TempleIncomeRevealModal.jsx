import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSound } from '@/sound/useSound'

const GOLD       = '#C9A961'
const GOLD_BRIGHT = '#F5D88B'

function fmt(n) { return Number(n).toLocaleString() }

export default function TempleIncomeRevealModal({ reward, onClose }) {
  const { play } = useSound()
  const payload = reward.payload ?? reward

  useEffect(() => {
    play('temple_buy')
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
          maxWidth: 380,
          background: 'var(--pw-bg-card, #1A1020)',
          border: `1px solid ${GOLD}55`,
          borderRadius: 12,
          padding: '28px 24px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏛</div>
          <div style={{
            fontFamily: "var(--pw-font-display, 'Cinzel', serif)",
            fontSize: 20,
            letterSpacing: '0.1em',
            color: GOLD_BRIGHT,
            marginBottom: 6,
          }}>
            TEMPLES OFFERED TRIBUTE
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: `${GOLD}99`,
          }}>
            While you were away ({payload.hours_away} hours)…
          </div>
        </div>

        {/* Income display */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '18px 14px',
          background: 'rgba(201,169,97,0.07)',
          border: `1px solid ${GOLD}33`,
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: "var(--pw-font-display, 'Cinzel', serif)",
            fontSize: 40,
            color: GOLD_BRIGHT,
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}>
            +{fmt(payload.drachma)} ₯
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: `${GOLD}88`,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            DRACHMA FROM TEMPLES
          </div>
        </div>

        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: 'rgba(240,240,248,0.38)',
          textAlign: 'center',
          marginBottom: 20,
          lineHeight: 1.5,
        }}>
          Your temples continue to generate income while you are offline.
        </div>

        {/* Collect button */}
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
          COLLECT
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

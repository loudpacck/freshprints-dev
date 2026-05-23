import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  PLOTS, PROFESSION_DATA, TEMPLE_DATA,
  getBuildingName, getTownhallTier,
} from './townshipConfig'

// ── Shared primitives ─────────────────────────────────────────────────────────

function StatBlock({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        fontSize: 9,
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: '0.1em',
        color: 'rgba(201,169,97,0.45)',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 16,
        fontFamily: "'Cinzel', serif",
        color: '#EDC87C',
      }}>
        {value}
      </span>
    </div>
  )
}

function InfoBox({ children }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'rgba(201,169,97,0.06)',
      border: '1px solid rgba(201,169,97,0.15)',
      borderRadius: 4,
      marginTop: 16,
    }}>
      {children}
    </div>
  )
}

function UpgradeBar({ upgradeCompletesAt }) {
  const [msLeft, setMsLeft] = useState(() => new Date(upgradeCompletesAt) - Date.now())

  useEffect(() => {
    if (msLeft <= 0) return
    const id = setInterval(() => {
      const remaining = new Date(upgradeCompletesAt) - Date.now()
      setMsLeft(remaining)
    }, 1000)
    return () => clearInterval(id)
  }, [upgradeCompletesAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = msLeft <= 0
  let timeStr
  if (done) {
    timeStr = 'Complete — refresh to see changes'
  } else {
    const h = Math.floor(msLeft / 3600000)
    const m = Math.floor((msLeft % 3600000) / 60000)
    const s = Math.floor((msLeft % 60000) / 1000)
    timeStr = h > 0 ? `${h}h ${m}m remaining` : m > 0 ? `${m}m ${s}s remaining` : `${s}s remaining`
  }

  return (
    <div style={{
      padding: '8px 12px',
      background: done ? 'rgba(34,197,94,0.07)' : 'rgba(245,158,11,0.08)',
      border: `1px solid ${done ? 'rgba(34,197,94,0.28)' : 'rgba(245,158,11,0.22)'}`,
      borderRadius: 4,
      marginBottom: 14,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 11,
      color: done ? '#22C55E' : '#F59E0B',
      letterSpacing: '0.08em',
    }}>
      {done ? '✓ UPGRADE ' : '⟳ UPGRADING — '}{timeStr}
    </div>
  )
}

function getBonusUnit(bonusType) {
  if (bonusType === 'flat_attack' || bonusType === 'flat_defense') return ''
  return '%'
}

// ── Per-building-type content ─────────────────────────────────────────────────

function ProfessionContent({ plot, townships }) {
  const pd = PROFESSION_DATA[plot.id]
  const t  = (townships || []).find(t => t.type === plot.id)
  const isOwned = t?.is_owned

  if (!isOwned) {
    return (
      <div>
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.65, color: 'rgba(237,227,204,0.5)' }}>
          Establish this profession to unlock a bonus for your settlement.
          Visit the Township management page to get started.
        </p>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <StatBlock label="Establish Cost" value={`${(pd?.establishCost || 0).toLocaleString()} ⚜`} />
          <StatBlock label="Level Required" value={`Lv. ${pd?.levelReq || '?'}`} />
        </div>
        <InfoBox>
          <p style={{ margin: 0, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em', color: 'rgba(201,169,97,0.6)' }}>
            {pd?.bonusLabel?.toUpperCase() || 'BONUS'} AT MAX: {pd?.bonusAtMax || '—'}
          </p>
        </InfoBox>
      </div>
    )
  }

  const tier = t.current_level >= 67 ? 3 : t.current_level >= 34 ? 2 : 1
  const unit = getBonusUnit(t.bonus_type)
  const bonusStr = t.current_bonus != null ? `+${t.current_bonus}${unit}` : '—'

  return (
    <div>
      {t.is_upgrading && (
        <UpgradeBar upgradeCompletesAt={t.upgrade_completes_at} />
      )}
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatBlock label="Level" value={t.current_level} />
        <StatBlock label="Tier" value={`T${tier}`} />
        <StatBlock label={pd?.bonusLabel || 'Bonus'} value={bonusStr} />
      </div>
      <InfoBox>
        <p style={{ margin: 0, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em', color: 'rgba(201,169,97,0.6)' }}>
          MAX BONUS: {pd?.bonusAtMax || '—'} at Level 100
        </p>
      </InfoBox>
    </div>
  )
}

function TownhallContent({ townships }) {
  const tier   = getTownhallTier(townships)
  const stages = ['Foundation', 'Established', 'Grand Seat']

  return (
    <div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatBlock label="Stage" value={tier} />
        <StatBlock label="Status" value={stages[tier - 1]} />
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'rgba(237,227,204,0.5)' }}>
        The Town Hall grows with your professions. Reach Stage 2 when all 8 professions
        are Level 34+, Stage 3 when all reach Level 67+.
      </p>
    </div>
  )
}

function EmbassyContent() {
  return (
    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'rgba(237,227,204,0.5)' }}>
      The Embassy hosts diplomatic ties with other factions. Alliance systems
      are being constructed and will be available in a future update.
    </p>
  )
}

function TempleContent({ plot, templeData }) {
  const td    = TEMPLE_DATA[plot.templeType]
  const owned = (templeData?.owned || []).find(t => t.temple_type === plot.templeType)

  if (!owned) {
    return (
      <div>
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.65, color: 'rgba(237,227,204,0.5)' }}>
          This sacred ground lies unoccupied. Visit the Temples page to unlock
          and upgrade this shrine for passive divine income.
        </p>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <StatBlock label="Level Required" value={`Lv. ${td?.levelReq || '?'}`} />
          <StatBlock label="Max Income" value={`${(td?.incomePerHr || 0).toLocaleString()} /hr`} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatBlock label="Level" value={`${owned.upgrade_level} / ${td?.maxLevel || 25}`} />
        <StatBlock label="Income" value={`${(td?.incomePerHr || 0).toLocaleString()} /hr`} />
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'rgba(237,227,204,0.5)' }}>
        Visit the Temples page to upgrade this shrine and increase its divine income.
      </p>
    </div>
  )
}

// ── Modal inner content ────────────────────────────────────────────────────────

function ModalContent({ plotId, assetKey, townships, templeData }) {
  const plot = PLOTS.find(p => p.id === plotId)
  if (!plot) return null

  const name = getBuildingName(plot.id, assetKey) || plot.id

  let subtitle = ''
  let body     = null

  if (plot.templeType) {
    const td = TEMPLE_DATA[plot.templeType]
    subtitle = td?.name || plot.templeType
    body     = <TempleContent plot={plot} templeData={templeData} />
  } else if (plot.id === 'townhall') {
    subtitle = 'Town Center'
    body     = <TownhallContent townships={townships} />
  } else if (plot.id === 'embassy') {
    subtitle = 'Alliance Hub'
    body     = <EmbassyContent />
  } else {
    const pd = PROFESSION_DATA[plot.id]
    subtitle = pd ? `Bonus: ${pd.bonusLabel}` : 'Profession'
    body     = <ProfessionContent plot={plot} townships={townships} />
  }

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <p style={{
          margin: '0 0 5px',
          fontSize: 9,
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: '0.12em',
          color: 'rgba(201,169,97,0.45)',
          textTransform: 'uppercase',
        }}>
          {subtitle}
        </p>
        <h2 style={{
          margin: 0,
          fontFamily: "'Cinzel', serif",
          fontSize: 19,
          fontWeight: 400,
          color: '#EDC87C',
          letterSpacing: '0.05em',
          lineHeight: 1.2,
        }}>
          {name}
        </h2>
      </div>
      {body}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BuildingModal({ plotId, assetKey, townships, templeData, onClose }) {
  const panelRef     = useRef(null)
  const lastFocusRef = useRef(null)

  // Escape key handler
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Focus management and trap when modal is open
  useEffect(() => {
    if (!plotId) return

    lastFocusRef.current = document.activeElement

    // Delay focus until animation settles
    const focusTimer = setTimeout(() => {
      const btn = panelRef.current?.querySelector('[data-close-btn]')
      if (btn) btn.focus()
    }, 60)

    function trapTab(e) {
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusable = panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener('keydown', trapTab)
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', trapTab)
      if (lastFocusRef.current?.focus) lastFocusRef.current.focus()
    }
  }, [plotId])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const panelVariants = isMobile
    ? {
        hidden:  { y: '100%', opacity: 0 },
        visible: { y: 0, opacity: 1 },
        exit:    { y: '100%', opacity: 0 },
      }
    : {
        hidden:  { x: 360, opacity: 0 },
        visible: { x: 0, opacity: 1 },
        exit:    { x: 360, opacity: 0 },
      }

  const panelStyle = isMobile
    ? {
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '54%',
        zIndex: 400,
        background: 'linear-gradient(180deg, #100C1F 0%, #0C0915 100%)',
        borderTop: '1px solid rgba(201,169,97,0.22)',
        borderRadius: '12px 12px 0 0',
        padding: '20px 22px 36px',
        overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
      }
    : {
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 340,
        zIndex: 400,
        background: 'linear-gradient(135deg, #100C1F 0%, #0C0915 100%)',
        borderLeft: '1px solid rgba(201,169,97,0.22)',
        padding: '28px 24px',
        overflowY: 'auto',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
      }

  return createPortal(
    <AnimatePresence>
      {plotId && (
        <>
          <motion.div
            key="bm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 399,
              background: 'rgba(0,0,0,0.35)',
            }}
          />

          <motion.div
            key={`bm-panel-${plotId}`}
            ref={panelRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="Building details"
            style={panelStyle}
          >
            <button
              data-close-btn
              onClick={onClose}
              aria-label="Close building details"
              style={{
                position: 'absolute',
                top: 14, right: 16,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(201,169,97,0.5)',
                fontSize: 22,
                lineHeight: 1,
                padding: '4px 6px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#EDC87C'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(201,169,97,0.5)'}
            >
              ×
            </button>

            <ModalContent
              plotId={plotId}
              assetKey={assetKey}
              townships={townships}
              templeData={templeData}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

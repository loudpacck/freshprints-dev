import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import { useSound } from '@/sound/useSound'

// ─── Constants (mirror the backend) ─────────────────────────────────────────────

const FOUND_LEVEL   = 25
const FOUND_DRACHMA = 100000
const FOUND_GLORY   = 100
const MEMBER_CAP    = 25
const MIN_INVITE_LEVEL = 5

// Item donation power = RARITY_VALUE[rarity] * (level_required || 1). Matches the handler.
const RARITY_VALUE = { common: 1, uncommon: 5, rare: 25, epic: 100, legendary: 500 }

// Tier floors → progress-ring math (computePowerTier on the server).
const TIER_FLOORS = [0, 1_000, 10_000, 100_000, 1_000_000, 10_000_000]
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V']

const RARITY_COLOR = {
  common:    '#B0B0B0',
  uncommon:  '#4ADE80',
  rare:      '#60A5FA',
  epic:      '#C084FC',
  legendary: '#FACC15',
}

// Heraldic palette — crimson (military), aged gold (economic), slate (overall/ceremonial).
const CREST = {
  military: { main: '#C0473C', bright: '#E0655A', bg: 'rgba(192,71,60,0.08)',  border: 'rgba(192,71,60,0.32)',  glow: 'rgba(192,71,60,0.45)' },
  economic: { main: '#C9A961', bright: '#FFB347', bg: 'rgba(201,169,97,0.08)', border: 'rgba(201,169,97,0.32)', glow: 'rgba(201,169,97,0.45)' },
  overall:  { main: '#A6B2C0', bright: '#D6DEE7', bg: 'rgba(166,178,192,0.08)', border: 'rgba(166,178,192,0.32)', glow: 'rgba(166,178,192,0.4)' },
}

const RANK = {
  founder: { label: 'FOUNDER', icon: '♛', color: '#FFD24A', bg: 'rgba(255,210,74,0.12)',  border: 'rgba(255,210,74,0.42)' },
  officer: { label: 'OFFICER', icon: '⛨', color: '#C5CDD6', bg: 'rgba(197,205,214,0.12)', border: 'rgba(197,205,214,0.42)' },
  veteran: { label: 'VETERAN', icon: '❧', color: '#C08A4A', bg: 'rgba(192,138,74,0.12)',  border: 'rgba(192,138,74,0.42)' },
  member:  { label: 'MEMBER',  icon: '•', color: '#9A9AA6', bg: 'rgba(154,154,166,0.1)',  border: 'rgba(154,154,166,0.32)' },
}

const ERROR_MSG = {
  name_taken: 'That name is already taken.',
  tag_taken: 'That tag is already taken.',
  profane: 'Name or tag contains banned words.',
  invalid_name: 'Name must be 3–30 characters.',
  invalid_tag: 'Tag must be 2–4 characters.',
  level_too_low: `You must be level ${FOUND_LEVEL} to found an alliance.`,
  insufficient_drachma: 'Not enough drachma.',
  insufficient_glory: 'Not enough glory.',
  leave_cooldown: 'You are still on alliance cooldown.',
  cooldown_active: 'You are still on alliance cooldown.',
  already_in_alliance: 'You are already in an alliance.',
  insufficient_funds: 'Not enough resources.',
  target_not_found: 'No warrior by that name.',
  user_not_found: 'No warrior by that name.',
  target_too_low_level: `That warrior must be at least level ${MIN_INVITE_LEVEL}.`,
  target_already_in_alliance: 'That warrior is already in an alliance.',
  alliance_full: `The alliance is full (${MEMBER_CAP}/${MEMBER_CAP}).`,
  invite_exists: 'An invite is already pending for that warrior.',
  invite_not_found: 'That invitation is no longer available.',
  insufficient_rank: 'Your rank does not permit this.',
  invalid_amount: 'Enter a valid amount.',
  item_equipped: 'Unequip the item before donating it.',
  item_not_found: 'Item not found.',
  not_in_alliance: 'You are not in an alliance.',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function num(v) { return Number(v) || 0 }
function fmt(n) { return num(n).toLocaleString() }
function msg(json, fallback = 'Something went wrong.') {
  return ERROR_MSG[json?.error] || json?.message || fallback
}
function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return '—' }
}
function formatHMS(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
// Ring fill % + the next threshold for the given raw power & tier.
function tierRing(power, tier) {
  if (tier >= 5) return { pct: 100, next: null }
  const floor = TIER_FLOORS[tier]
  const next = TIER_FLOORS[tier + 1]
  const pct = Math.max(0, Math.min(100, ((power - floor) / (next - floor)) * 100))
  return { pct, next }
}

async function getJson(action, query = '') {
  const res = await fetch(`/api/games/pantheon-wars/game?action=${action}${query}`)
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}
async function postJson(action, body) {
  const res = await fetch(`/api/games/pantheon-wars/game?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

// ─── Shared primitives ──────────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <p style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
      color: 'rgba(240,240,248,0.28)',
      margin: '0 0 14px',
    }}>
      // {children}
    </p>
  )
}

function Panel({ children, style }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 10,
      padding: '18px 20px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, maxLength, type = 'text', textarea, disabled }) {
  const base = {
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    color: '#EDE3CC',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(201,169,97,0.28)',
    borderRadius: 6,
    padding: '10px 12px',
    outline: 'none',
  }
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{
        display: 'block',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(240,240,248,0.4)', marginBottom: 6,
      }}>
        {label}
      </span>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          maxLength={maxLength} disabled={disabled} rows={3} style={{ ...base, resize: 'vertical' }} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          maxLength={maxLength} type={type} disabled={disabled} style={base} />
      )}
    </label>
  )
}

function GoldButton({ onClick, disabled, children, danger, full, small }) {
  const active = !disabled
  const color = danger ? '#E0655A' : '#C9A961'
  const bdr = danger ? 'rgba(224,101,90,0.5)' : 'rgba(201,169,97,0.5)'
  return (
    <motion.button
      whileHover={active ? { scale: 1.03 } : {}}
      whileTap={active ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: small ? 9 : 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: active ? color : 'rgba(240,240,248,0.25)',
        background: 'transparent',
        border: `1px solid ${active ? bdr : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 6,
        padding: small ? '7px 12px' : '10px 16px',
        cursor: active ? 'pointer' : 'not-allowed',
        whiteSpace: 'nowrap',
        width: full ? '100%' : undefined,
        transition: 'color 150ms, border-color 150ms',
      }}
    >
      {children}
    </motion.button>
  )
}

function RankBadge({ rank, size = 'sm' }) {
  const r = RANK[rank] || RANK.member
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: size === 'lg' ? 11 : 8.5,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: r.color, background: r.bg,
      border: `1px solid ${r.border}`,
      borderRadius: 4, padding: size === 'lg' ? '4px 10px' : '2px 7px',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: size === 'lg' ? 13 : 11, lineHeight: 1 }}>{r.icon}</span>
      {r.label}
    </span>
  )
}

function TierPips({ tiers }) {
  // tiny three-dot summary used on browse/invite cards: [mil, eco, overall]
  const order = [
    { c: CREST.military.main, v: tiers.military },
    { c: CREST.economic.main, v: tiers.economic },
    { c: CREST.overall.main,  v: tiers.overall },
  ]
  return (
    <span style={{ display: 'inline-flex', gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
      {order.map((o, i) => (
        <span key={i} style={{ color: o.c, letterSpacing: '0.06em' }}>
          {['⚔', '₯', '✦'][i]} {ROMAN[Math.max(0, Math.min(5, num(o.v)))]}
        </span>
      ))}
    </span>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ toast, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3400)
    return () => clearTimeout(t)
  }, [onClose])
  const isErr = toast.kind === 'error'
  const border = isErr ? 'rgba(224,101,90,0.6)' : 'rgba(201,169,97,0.6)'
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 88px)',
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 60, maxWidth: 'calc(100vw - 32px)', width: 'max-content',
        background: 'linear-gradient(180deg, var(--color-bg-elevated, #14101A), var(--color-bg-base, #0A0710))',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${border}`, borderRadius: 6,
        padding: '12px 22px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14,
        boxShadow: '0 0 18px rgba(201,169,97,0.25), 0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: '0.1em', color: isErr ? '#E0655A' : '#C9A961' }}>
        ⚜ {toast.title}
      </span>
      {toast.sub && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.55)' }}>
          {toast.sub}
        </span>
      )}
    </motion.div>
  )
}

// ─── Power crest ───────────────────────────────────────────────────────────────

function CrestRing({ pct, color, glow, numeral, size = 76 }) {
  const stroke = 5
  const r = (size - stroke) / 2 - 2
  const c = 2 * Math.PI * r
  const dash = c * (Math.max(0, Math.min(100, pct)) / 100)
  const cx = size / 2
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 0.95, ease: 'easeOut' }}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 700, color, lineHeight: 1,
        textShadow: `0 0 12px ${glow}`,
      }}>
        {numeral}
      </div>
    </div>
  )
}

function PowerCrest({ kind, icon, title, tier, power, perks }) {
  const c = CREST[kind]
  const safeTier = Math.max(0, Math.min(5, num(tier)))
  let pct, nextLabel
  if (kind === 'overall') {
    pct = (safeTier / 5) * 100
    nextLabel = 'Combined standing'
  } else {
    const ring = tierRing(num(power), safeTier)
    pct = ring.pct
    nextLabel = ring.next ? `${fmt(power)} / ${fmt(ring.next)} PWR` : `${fmt(power)} PWR · MAX`
  }
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
      padding: '14px 8px 12px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, marginBottom: 4, lineHeight: 1, color: c.bright }}>{icon}</div>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: c.main, marginBottom: 10,
      }}>
        {title}
      </div>
      <CrestRing pct={pct} color={c.bright} glow={c.glow} numeral={ROMAN[safeTier]} />
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, color: 'rgba(240,240,248,0.45)',
        marginTop: 8, letterSpacing: '0.04em', minHeight: 11,
      }}>
        {nextLabel}
      </div>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: c.main,
        marginTop: 6, letterSpacing: '0.04em', lineHeight: 1.4,
      }}>
        {perks}
      </div>
    </div>
  )
}

// ─── Member action modal ─────────────────────────────────────────────────────────

function MemberActionModal({ member, myRank, onAction, onClose, busy }) {
  const r = RANK[member.rank] || RANK.member
  const canPromote  = myRank === 'founder' && (member.rank === 'member' || member.rank === 'veteran')
  const canDemote   = myRank === 'founder' && member.rank === 'officer'
  const canTransfer = myRank === 'founder' && member.rank === 'officer'
  const canKick     = (myRank === 'founder' && member.rank !== 'founder') ||
                      (myRank === 'officer' && (member.rank === 'member' || member.rank === 'veteran'))

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(4,2,10,0.82)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 340,
          background: 'linear-gradient(180deg, #14101A, #0A0710)',
          border: '1px solid rgba(201,169,97,0.4)', borderRadius: 12, padding: '24px 22px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: '#EDE3CC', marginBottom: 8 }}>
            {member.username}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <RankBadge rank={member.rank} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.4)' }}>
              LVL {num(member.level)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {canPromote && (
            <GoldButton full onClick={() => onAction('alliance_promote', 'Promoted to officer')} disabled={busy}>
              ↑ Promote to Officer
            </GoldButton>
          )}
          {canDemote && (
            <GoldButton full onClick={() => onAction('alliance_demote', 'Demoted')} disabled={busy}>
              ↓ Demote Officer
            </GoldButton>
          )}
          {canTransfer && (
            <GoldButton full onClick={() => onAction('alliance_transfer_ownership', 'Ownership transferred')} disabled={busy}>
              ♛ Transfer Ownership
            </GoldButton>
          )}
          {canKick && (
            <GoldButton full danger onClick={() => onAction('alliance_kick', 'Banner struck down')} disabled={busy}>
              ✕ Kick from Alliance
            </GoldButton>
          )}
          {!canPromote && !canDemote && !canTransfer && !canKick && (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.4)', textAlign: 'center', margin: 0 }}>
              No actions available for this member.
            </p>
          )}
        </div>

        <button onClick={onClose} style={{
          marginTop: 16, width: '100%', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          letterSpacing: '0.1em', color: 'rgba(240,240,248,0.5)', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '9px', cursor: 'pointer',
        }}>
          CLOSE
        </button>
      </motion.div>
    </motion.div>,
    document.body
  )
}

// ─── Disband modal (tag confirmation) ──────────────────────────────────────────

function DisbandModal({ alliance, onConfirm, onClose, busy }) {
  const [typed, setTyped] = useState('')
  const matches = typed.trim().toUpperCase() === String(alliance.tag).toUpperCase()
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(4,2,10,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 360,
          background: 'linear-gradient(180deg, #1A0E0E, #0A0710)',
          border: '1px solid rgba(224,101,90,0.5)', borderRadius: 12, padding: '24px 22px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 17, color: '#E0655A', letterSpacing: '0.08em', marginBottom: 10, textAlign: 'center' }}>
          DISBAND ALLIANCE
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(240,240,248,0.6)', lineHeight: 1.55, margin: '0 0 16px' }}>
          This will permanently dissolve <strong style={{ color: '#EDE3CC' }}>{alliance.name}</strong>. All members
          will be ejected and the war chest is lost forever. This cannot be undone.
        </p>
        <Field
          label={`Type the tag [${alliance.tag}] to confirm`}
          value={typed} onChange={setTyped} placeholder={alliance.tag} maxLength={4} disabled={busy}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onClose} disabled={busy} style={{
            flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
            color: 'rgba(240,240,248,0.6)', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '11px', cursor: 'pointer',
          }}>
            CANCEL
          </button>
          <button onClick={onConfirm} disabled={!matches || busy} style={{
            flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
            color: matches && !busy ? '#0F0A0D' : 'rgba(224,101,90,0.4)',
            background: matches && !busy ? 'linear-gradient(135deg, #E0655A, #B8443A)' : 'transparent',
            border: `1px solid ${matches && !busy ? 'transparent' : 'rgba(224,101,90,0.25)'}`,
            borderRadius: 6, padding: '11px', cursor: matches && !busy ? 'pointer' : 'not-allowed', fontWeight: 700,
          }}>
            {busy ? 'DISBANDING…' : 'DISBAND'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

// ─── Banner / invite cards ─────────────────────────────────────────────────────

function AllianceBannerCard({ inv, children }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(201,169,97,0.07), rgba(192,71,60,0.06))',
      border: '1px solid rgba(201,169,97,0.28)', borderRadius: 10, padding: '16px 18px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: '#EDE3CC', letterSpacing: '0.04em' }}>
          {inv.alliance_name}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#C9A961', letterSpacing: '0.08em' }}>
          [{inv.alliance_tag}]
        </span>
      </div>
      {inv.alliance_description && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(240,240,248,0.55)', lineHeight: 1.5, margin: '0 0 10px' }}>
          {inv.alliance_description}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.4)' }}>
          {num(inv.member_count)} / {MEMBER_CAP} members
        </span>
        <TierPips tiers={{ military: inv.military_tier, economic: inv.economic_tier, overall: inv.overall_tier }} />
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.32)', marginBottom: 12 }}>
        Invited by {inv.inviter_username}
      </div>
      {children}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }

export default function Alliance() {
  const { user, stats, loading: authLoading, refresh: refreshContext } = usePantheonWars()
  const { play } = useSound()
  const navigate = useNavigate()

  const [data, setData] = useState(null)   // alliance_info response
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  // NO_ALLIANCE
  const [invitesReceived, setInvitesReceived] = useState([])
  const [cooldownEnd, setCooldownEnd] = useState(0)
  const [nowTick, setNowTick] = useState(Date.now())

  // found form
  const [fName, setFName] = useState('')
  const [fTag, setFTag] = useState('')
  const [fDesc, setFDesc] = useState('')

  // IN_ALLIANCE
  const [invitesSent, setInvitesSent] = useState([])
  const [inventory, setInventory] = useState([])
  const [treasuryLog, setTreasuryLog] = useState([])

  // donation inputs
  const [drachmaAmt, setDrachmaAmt] = useState('')
  const [gloryAmt, setGloryAmt] = useState('')
  const [donateItemId, setDonateItemId] = useState('')

  // invite send
  const [inviteName, setInviteName] = useState('')
  const [inviteMsg, setInviteMsg] = useState(null)
  const [inviting, setInviting] = useState(false)

  // modals
  const [memberModal, setMemberModal] = useState(null)
  const [disbandOpen, setDisbandOpen] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // one-second ticker for the cooldown countdown
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const fetchReceivedInvites = useCallback(async () => {
    const { ok, json } = await getJson('alliance_invite_list_received')
    if (ok) setInvitesReceived(json.invites || [])
  }, [])

  const fetchSentInvites = useCallback(async () => {
    const { ok, json } = await getJson('alliance_invite_list_sent')
    if (ok) setInvitesSent(json.invites || [])
  }, [])

  const fetchInventory = useCallback(async () => {
    const { ok, json } = await getJson('inventory')
    if (ok) setInventory((json.inventory || []).filter(i => !i.equipped))
  }, [])

  const fetchTreasuryLog = useCallback(async () => {
    const { ok, json } = await getJson('alliance_treasury_log')
    if (ok) setTreasuryLog(json.log || [])
  }, [])

  const fetchAlliance = useCallback(async () => {
    try {
      const { ok, status, json } = await getJson('alliance_info')
      if (status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      if (!ok) { setError('Failed to load alliance data.'); return }
      setData(json)
      setError(null)
      if (!json.alliance) {
        const cd = num(json.cooldown_remaining_seconds)
        setCooldownEnd(cd > 0 ? Date.now() + cd * 1000 : 0)
        setInvitesSent([]); setInventory([])
        fetchReceivedInvites()
      } else {
        setInvitesReceived([])
        fetchInventory()
        fetchTreasuryLog()
        const rank = json.member?.rank
        if (rank === 'founder' || rank === 'officer') fetchSentInvites()
        else setInvitesSent([])
      }
    } catch {
      setError('Network error. Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [navigate, fetchReceivedInvites, fetchSentInvites, fetchInventory, fetchTreasuryLog])

  useEffect(() => {
    if (!authLoading && !user) { navigate('/games/pantheon-wars/login', { replace: true }); return }
    if (!authLoading) fetchAlliance()
  }, [authLoading, user, navigate, fetchAlliance])

  useEffect(() => {
    function onAllianceChanged() { fetchAlliance() }
    window.addEventListener('fp-alliance-changed', onAllianceChanged)
    return () => window.removeEventListener('fp-alliance-changed', onAllianceChanged)
  }, [fetchAlliance])

  const cooldownRemaining = cooldownEnd > 0 ? Math.max(0, Math.ceil((cooldownEnd - nowTick) / 1000)) : 0

  function showToast(kind, title, sub) { setToast({ kind, title, sub, id: Date.now() }) }

  // ── Mutations ──────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (busy) return
    setBusy(true)
    try {
      const { ok, json } = await postJson('alliance_create', {
        name: fName.trim(), tag: fTag.trim(), description: fDesc.trim() || undefined,
      })
      if (ok) {
        play('titan_horn')
        showToast('success', `${json.alliance?.name?.toUpperCase() || 'ALLIANCE'} FOUNDED`, `[${json.alliance?.tag}] raises its banner.`)
        setFName(''); setFTag(''); setFDesc('')
        refreshContext()
        await fetchAlliance()
      } else {
        play('error')
        showToast('error', 'CANNOT FOUND', msg(json))
      }
    } finally { setBusy(false) }
  }

  async function handleAcceptInvite(inviteId) {
    if (busy) return
    setBusy(true)
    try {
      const { ok, json } = await postJson('alliance_invite_accept', { invite_id: Number(inviteId) })
      if (ok) {
        play('titan_horn')
        showToast('success', 'BANNER JOINED', `Welcome to ${json.alliance?.name}.`)
        refreshContext()
        await fetchAlliance()
      } else {
        play('error')
        showToast('error', 'CANNOT JOIN', msg(json))
        fetchReceivedInvites()
      }
    } finally { setBusy(false) }
  }

  async function handleDeclineInvite(inviteId) {
    const { ok, json } = await postJson('alliance_invite_decline', { invite_id: Number(inviteId) })
    if (ok) {
      setInvitesReceived(prev => prev.filter(i => Number(i.id) !== Number(inviteId)))
    } else {
      showToast('error', 'ERROR', msg(json))
      fetchReceivedInvites()
    }
  }

  async function handleMemberAction(action, successTitle) {
    if (busy || !memberModal) return
    setBusy(true)
    try {
      const { ok, json } = await postJson(action, { target_user_id: memberModal.user_id })
      if (ok) {
        play(action === 'alliance_kick' ? 'error' : 'success')
        showToast('success', successTitle.toUpperCase(), memberModal.username)
        setMemberModal(null)
        await fetchAlliance()
      } else {
        play('error')
        showToast('error', 'ACTION FAILED', msg(json))
      }
    } finally { setBusy(false) }
  }

  async function handleLeave() {
    if (busy) return
    setBusy(true)
    try {
      const { ok, json } = await postJson('alliance_leave')
      if (ok) {
        play('error')
        showToast('success', json.disbanded ? 'BANNER FALLS' : 'YOU HAVE LEFT', json.disbanded ? 'The alliance dissolved with your departure.' : 'A 24h cooldown now applies.')
        setConfirmLeave(false)
        refreshContext()
        await fetchAlliance()
      } else {
        play('error')
        showToast('error', 'CANNOT LEAVE', msg(json))
      }
    } finally { setBusy(false) }
  }

  async function handleDisband() {
    if (busy) return
    setBusy(true)
    try {
      const { ok, json } = await postJson('alliance_disband')
      if (ok) {
        play('error')
        showToast('success', 'ALLIANCE DISBANDED', 'The banner is struck from the hall.')
        setDisbandOpen(false)
        await fetchAlliance()
      } else {
        play('error')
        showToast('error', 'CANNOT DISBAND', msg(json))
      }
    } finally { setBusy(false) }
  }

  async function handleDonate(kind) {
    if (busy) return
    let action, body, label
    if (kind === 'drachma') {
      const amount = parseInt(drachmaAmt, 10)
      if (!Number.isInteger(amount) || amount <= 0) { showToast('error', 'INVALID', 'Enter a valid drachma amount.'); return }
      action = 'alliance_donate_drachma'; body = { amount }; label = `${fmt(amount)} ₯`
    } else if (kind === 'glory') {
      const amount = parseInt(gloryAmt, 10)
      if (!Number.isInteger(amount) || amount <= 0) { showToast('error', 'INVALID', 'Enter a valid glory amount.'); return }
      action = 'alliance_donate_glory'; body = { amount }; label = `${fmt(amount)} ✦`
    } else {
      const inventory_id = Number(donateItemId)
      if (!inventory_id) { showToast('error', 'INVALID', 'Select an item to donate.'); return }
      action = 'alliance_donate_item'; body = { inventory_id }
      const it = inventory.find(i => i.inventory_id === inventory_id)
      label = it ? it.name : 'item'
    }
    setBusy(true)
    try {
      const { ok, json } = await postJson(action, body)
      if (ok) {
        play('purchase')
        showToast('success', 'OFFERING ACCEPTED', `${label} added to the war chest`)
        setDrachmaAmt(''); setGloryAmt(''); setDonateItemId('')
        refreshContext()
        await fetchAlliance()
      } else {
        play('error')
        showToast('error', 'DONATION FAILED', msg(json))
      }
    } finally { setBusy(false) }
  }

  async function handleInvite() {
    const name = inviteName.trim()
    if (!name || inviting) return
    setInviting(true); setInviteMsg(null)
    try {
      const { ok, json } = await getJson('user_lookup', `&username=${encodeURIComponent(name)}`)
      if (!ok) { setInviteMsg({ kind: 'error', text: msg(json, 'No warrior by that name.') }); play('error'); return }
      if (num(json.level) < MIN_INVITE_LEVEL) {
        setInviteMsg({ kind: 'error', text: `${json.username} must be at least level ${MIN_INVITE_LEVEL}.` }); play('error'); return
      }
      const send = await postJson('alliance_invite_send', { target_user_id: json.id })
      if (!send.ok) { setInviteMsg({ kind: 'error', text: msg(send.json) }); play('error'); return }
      setInviteMsg({ kind: 'success', text: `Invite sent to ${send.json.target_username || json.username}.` })
      setInviteName('')
      play('toast_notification')
      fetchSentInvites()
    } catch {
      setInviteMsg({ kind: 'error', text: 'Network error.' })
    } finally { setInviting(false) }
  }

  async function handleCancelInvite(inviteId) {
    const { ok, json } = await postJson('alliance_invite_cancel', { invite_id: Number(inviteId) })
    if (ok) {
      setInvitesSent(prev => prev.filter(i => Number(i.id) !== Number(inviteId)))
    } else {
      showToast('error', 'ERROR', msg(json))
      fetchSentInvites()
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const inAlliance = !!data?.alliance
  const myRank = data?.member?.rank
  const isOfficerPlus = myRank === 'founder' || myRank === 'officer'

  return (
    <PWPageShell title="ALLIANCE" rightSlot={<PWBackButton />} backgroundVariant="alliance">
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map(i => <div key={i} className="pw-skel" style={{ height: 90, borderRadius: 10 }} />)}
        </div>
      ) : error ? (
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#E0655A', textAlign: 'center', marginTop: 48 }}>
          // {error}
        </p>
      ) : inAlliance ? (
        <InAllianceView
          data={data} stats={stats} myRank={myRank} isOfficerPlus={isOfficerPlus}
          inventory={inventory} invitesSent={invitesSent}
          drachmaAmt={drachmaAmt} setDrachmaAmt={setDrachmaAmt}
          gloryAmt={gloryAmt} setGloryAmt={setGloryAmt}
          donateItemId={donateItemId} setDonateItemId={setDonateItemId}
          inviteName={inviteName} setInviteName={setInviteName}
          inviteMsg={inviteMsg} inviting={inviting}
          showBreakdown={showBreakdown} setShowBreakdown={setShowBreakdown}
          confirmLeave={confirmLeave} setConfirmLeave={setConfirmLeave}
          busy={busy}
          onMemberClick={setMemberModal}
          onDonate={handleDonate}
          onInvite={handleInvite}
          onCancelInvite={handleCancelInvite}
          onLeave={handleLeave}
          onDisbandOpen={() => setDisbandOpen(true)}
        />
      ) : (
        <NoAllianceView
          stats={stats}
          invites={invitesReceived}
          cooldownRemaining={cooldownRemaining}
          fName={fName} setFName={setFName}
          fTag={fTag} setFTag={setFTag}
          fDesc={fDesc} setFDesc={setFDesc}
          busy={busy}
          onCreate={handleCreate}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
      )}

      <AnimatePresence>
        {toast && <Toast key={toast.id} toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {memberModal && (
          <MemberActionModal
            key="member-modal" member={memberModal} myRank={myRank}
            onAction={handleMemberAction} onClose={() => setMemberModal(null)} busy={busy}
          />
        )}
        {disbandOpen && data?.alliance && (
          <DisbandModal
            key="disband-modal" alliance={data.alliance}
            onConfirm={handleDisband} onClose={() => setDisbandOpen(false)} busy={busy}
          />
        )}
      </AnimatePresence>
    </PWPageShell>
  )
}

// ─── NO_ALLIANCE view ──────────────────────────────────────────────────────────

function NoAllianceView({ stats, invites, cooldownRemaining, fName, setFName, fTag, setFTag, fDesc, setFDesc, busy, onCreate, onAccept, onDecline }) {
  const [directory, setDirectory] = useState(null)  // null = loading, [] = empty
  useEffect(() => {
    let alive = true
    getJson('alliance_browse').then(({ ok, json }) => {
      if (alive) setDirectory(ok ? (json.alliances || []) : [])
    })
    return () => { alive = false }
  }, [])

  const level = num(stats?.level)
  const drachma = num(stats?.drachma)
  const glory = num(stats?.glory)

  const gates = [
    { ok: level >= FOUND_LEVEL, label: `Level ${FOUND_LEVEL}+`, detail: `you are level ${level}` },
    { ok: drachma >= FOUND_DRACHMA, label: `${fmt(FOUND_DRACHMA)} ₯`, detail: `you have ${fmt(drachma)} ₯` },
    { ok: glory >= FOUND_GLORY, label: `${fmt(FOUND_GLORY)} Glory`, detail: `you have ${fmt(glory)} ✦` },
    { ok: cooldownRemaining === 0, label: 'No active cooldown', detail: cooldownRemaining > 0 ? formatHMS(cooldownRemaining) : 'clear' },
  ]
  const nameValid = fName.trim().length >= 3 && fName.trim().length <= 30
  const tagValid = fTag.trim().length >= 2 && fTag.trim().length <= 4
  const allGates = gates.every(g => g.ok)
  const canFound = allGates && nameValid && tagValid && !busy

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {cooldownRemaining > 0 && (
        <motion.div variants={fadeUp} style={{
          background: 'rgba(224,101,90,0.1)', border: '1px solid rgba(224,101,90,0.4)', borderRadius: 10,
          padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '0.08em', color: '#E0655A' }}>
            ⏳ ALLIANCE COOLDOWN
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'rgba(240,240,248,0.7)' }}>
            You may join or found another in {formatHMS(cooldownRemaining)}
          </span>
        </motion.div>
      )}

      {/* Hero */}
      <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 34, marginBottom: 6, color: '#C9A961', lineHeight: 1 }}>⚜</div>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 28, color: '#EDE3CC', letterSpacing: '0.06em', margin: '0 0 6px' }}>
          YOU STAND ALONE
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(240,240,248,0.5)', margin: 0 }}>
          Found a new alliance, or accept an invitation to join one.
        </p>
      </motion.div>

      {/* Incoming invites */}
      <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
        <SectionHeader>INCOMING INVITATIONS</SectionHeader>
        {invites.length === 0 ? (
          <Panel><p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'rgba(240,240,248,0.4)', textAlign: 'center', margin: 0 }}>
            No active invitations.
          </p></Panel>
        ) : (
          invites.map(inv => (
            <AllianceBannerCard key={inv.id} inv={inv}>
              <div style={{ display: 'flex', gap: 8 }}>
                <GoldButton onClick={() => onAccept(inv.id)} disabled={busy}>✓ Accept</GoldButton>
                <GoldButton danger onClick={() => onDecline(inv.id)} disabled={busy}>✕ Decline</GoldButton>
              </div>
            </AllianceBannerCard>
          ))
        )}
      </motion.div>

      {/* Found a new alliance */}
      <motion.div variants={fadeUp}>
        <SectionHeader>FOUND A NEW ALLIANCE</SectionHeader>
        <Panel>
          <Field label="Alliance Name (3–30)" value={fName} onChange={setFName} placeholder="The Olympian Vanguard" maxLength={30} disabled={busy} />
          <Field label="Tag (2–4)" value={fTag} onChange={setFTag} placeholder="OLY" maxLength={4} disabled={busy} />
          <Field label="Description (optional)" value={fDesc} onChange={setFDesc} placeholder="A banner for the bold." maxLength={200} textarea disabled={busy} />

          <div style={{ margin: '6px 0 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {gates.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: g.ok ? '#5FB857' : '#E0655A', fontSize: 13, lineHeight: 1, width: 14 }}>
                  {g.ok ? '✓' : '✗'}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: g.ok ? 'rgba(240,240,248,0.7)' : 'rgba(240,240,248,0.45)' }}>
                  {g.label}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.3)', marginLeft: 'auto' }}>
                  {g.detail}
                </span>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={canFound ? { scale: 1.02 } : {}} whileTap={canFound ? { scale: 0.98 } : {}}
            onClick={onCreate} disabled={!canFound}
            style={{
              width: '100%', fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: '0.1em', fontWeight: 700,
              color: canFound ? '#0F0A0D' : 'rgba(201,169,97,0.4)',
              background: canFound ? 'linear-gradient(135deg, #FFB347, #C9A961)' : 'transparent',
              border: `1px solid ${canFound ? 'transparent' : 'rgba(201,169,97,0.2)'}`,
              borderRadius: 8, padding: '13px', cursor: canFound ? 'pointer' : 'not-allowed',
            }}
          >
            {busy ? 'FOUNDING…' : '⚜ FOUND ALLIANCE'}
          </motion.button>
        </Panel>
      </motion.div>

      {/* Directory of existing alliances (read-only — joining is invite-only) */}
      <motion.div variants={fadeUp} style={{ marginTop: 28 }}>
        <SectionHeader>THE HALL OF BANNERS</SectionHeader>
        {directory === null ? (
          <div className="pw-skel" style={{ height: 72, borderRadius: 10 }} />
        ) : directory.length === 0 ? (
          <Panel><p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'rgba(240,240,248,0.4)', textAlign: 'center', margin: 0 }}>
            No alliances have raised their banners yet. Be the first.
          </p></Panel>
        ) : (
          <>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.3)', margin: '0 0 12px', letterSpacing: '0.05em' }}>
              Membership is by invitation only — ask a founder or officer to send you an invite.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {directory.map(al => (
                <div key={al.id} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 10, padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: '#EDE3CC', letterSpacing: '0.04em' }}>{al.name}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#C9A961', letterSpacing: '0.08em' }}>[{al.tag}]</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.35)', marginLeft: 'auto' }}>
                      {num(al.member_count)} / {MEMBER_CAP}
                    </span>
                  </div>
                  {al.description && (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(240,240,248,0.5)', lineHeight: 1.45, margin: '0 0 8px' }}>
                      {al.description}
                    </p>
                  )}
                  <TierPips tiers={{ military: al.military_tier, economic: al.economic_tier, overall: al.overall_tier }} />
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── IN_ALLIANCE view ──────────────────────────────────────────────────────────

function InAllianceView(props) {
  const {
    data, stats, myRank, isOfficerPlus, inventory, invitesSent,
    drachmaAmt, setDrachmaAmt, gloryAmt, setGloryAmt, donateItemId, setDonateItemId,
    inviteName, setInviteName, inviteMsg, inviting,
    showBreakdown, setShowBreakdown, confirmLeave, setConfirmLeave, busy,
    onMemberClick, onDonate, onInvite, onCancelInvite, onLeave, onDisbandOpen,
  } = props

  const a = data.alliance
  const members = data.members || []
  const bd = data.power_breakdown || {}
  const founder = members.find(m => m.rank === 'founder')
  const memberCount = num(a.member_count)
  const emptySlots = Math.max(0, MEMBER_CAP - memberCount)

  const milTier = num(a.military_tier)
  const ecoTier = num(a.economic_tier)
  const ovrTier = num(a.overall_tier)

  // who can I act on? (mirrors backend; modal recomputes precise actions)
  function isActionable(m) {
    if (m.user_id === data.member.user_id) return false
    if (myRank === 'founder') return m.rank !== 'founder'
    if (myRank === 'officer') return m.rank === 'member' || m.rank === 'veteran'
    return false
  }

  const playerDrachma = num(stats?.drachma)
  const playerGlory = num(stats?.glory)
  const drachmaPreview = parseInt(drachmaAmt, 10) > 0 ? Math.floor(parseInt(drachmaAmt, 10) * 0.1) : 0
  const gloryPreview = parseInt(gloryAmt, 10) > 0 ? parseInt(gloryAmt, 10) * 10 : 0
  const selectedItem = inventory.find(i => i.inventory_id === Number(donateItemId))
  const itemPreview = selectedItem ? (RARITY_VALUE[selectedItem.rarity] || 0) * (num(selectedItem.level_required) || 1) : 0

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* ── Banner ── */}
      <motion.div variants={fadeUp} style={{
        background: 'linear-gradient(135deg, rgba(192,71,60,0.1), rgba(201,169,97,0.08))',
        border: '1px solid rgba(201,169,97,0.32)', borderRadius: 12, padding: '22px 20px', marginBottom: 20,
        position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #C0473C, #C9A961, #C0473C, transparent)' }} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(24px, 7vw, 34px)', color: '#EDE3CC', letterSpacing: '0.04em', lineHeight: 1.05 }}>
            {a.name}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: '#C9A961', letterSpacing: '0.08em' }}>
            [{a.tag}]
          </span>
        </div>
        {a.description && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontStyle: 'italic', color: 'rgba(240,240,248,0.5)', margin: '0 auto 10px', maxWidth: 420, lineHeight: 1.5 }}>
            {a.description}
          </p>
        )}
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.4)', marginBottom: 4 }}>
          Founded by {founder?.username || '—'} on {formatDate(a.created_at)}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#C9A961', letterSpacing: '0.08em', marginBottom: 12 }}>
          {memberCount} / {MEMBER_CAP} MEMBERS
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RankBadge rank={myRank} size="lg" />
        </div>
      </motion.div>

      {/* ── Power crests ── */}
      <motion.div variants={fadeUp} style={{ marginBottom: 8 }}>
        <SectionHeader>POWER CRESTS</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <PowerCrest kind="military" icon="⚔" title="Military" tier={milTier} power={a.military_power}
            perks={`+${milTier * 3}% ATK · +${milTier * 3}% DEF`} />
          <PowerCrest kind="economic" icon="₯" title="Economic" tier={ecoTier} power={a.economic_power}
            perks={`+${ecoTier * 3}% ₯ · +${ecoTier * 3}% ✦`} />
          <PowerCrest kind="overall" icon="❦" title="Overall" tier={ovrTier}
            perks="Avg. of crests" />
        </div>
        <button onClick={() => setShowBreakdown(v => !v)} style={{
          marginTop: 10, width: '100%', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(201,169,97,0.7)', background: 'transparent',
          border: '1px solid rgba(201,169,97,0.2)', borderRadius: 6, padding: '8px', cursor: 'pointer',
        }}>
          {showBreakdown ? 'Hide power breakdown ▴' : 'View power breakdown ▾'}
        </button>
        <AnimatePresence>
          {showBreakdown && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}>
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <BreakdownGroup title="Military" color={CREST.military.main} rows={[
                  ['Member combat', fmt(bd.member_combat_sum)],
                  ['Military townships', fmt(bd.member_military_townships)],
                  ['Item donations', fmt(bd.item_donations_value)],
                ]} />
                <BreakdownGroup title="Economic" color={CREST.economic.main} rows={[
                  ['Temple income', fmt(Math.round(num(bd.member_temple_income)))],
                  ['Economic townships', fmt(bd.member_economic_townships)],
                  ['Drachma & glory', fmt(bd.drachma_glory_value)],
                ]} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Roster ── */}
      <motion.div variants={fadeUp} style={{ marginTop: 20 }}>
        <SectionHeader>{memberCount} / {MEMBER_CAP} SLOTS FILLED</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {members.map(m => {
            const isSelf = m.user_id === data.member.user_id
            const actionable = isActionable(m)
            const r = RANK[m.rank] || RANK.member
            return (
              <motion.div
                key={m.user_id}
                whileHover={actionable ? { scale: 1.02 } : {}}
                onClick={() => actionable && onMemberClick(m)}
                style={{
                  background: isSelf ? 'rgba(201,169,97,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelf ? 'rgba(201,169,97,0.4)' : 'rgba(255,255,255,0.09)'}`,
                  borderRadius: 10, padding: '12px 12px', cursor: actionable ? 'pointer' : 'default',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 13, color: r.color, lineHeight: 1 }}>
                  {r.icon}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: '#EDE3CC', marginBottom: 4, paddingRight: 16, wordBreak: 'break-word' }}>
                  {m.username}{isSelf && <span style={{ color: '#C9A961', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}> (you)</span>}
                </div>
                <div style={{ marginBottom: 6 }}><RankBadge rank={m.rank} /></div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: 'rgba(240,240,248,0.4)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span>LVL {num(m.level)}</span>
                  {m.class && <span style={{ textTransform: 'capitalize' }}>{m.class}</span>}
                </div>
                {m.combat_power != null && (
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, color: 'rgba(240,240,248,0.35)', marginTop: 3 }}>
                    Combat: {num(m.combat_power)} · Township: {num(m.township_total)} · {fmt(Math.round(m.temple_income_per_hour))}₯/hr
                  </div>
                )}
                {m.donation_lifetime_drachma != null && (
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'rgba(201,169,97,0.45)', marginTop: 2 }}>
                    Donated: {fmt(m.donation_lifetime_drachma)}₯ · {fmt(m.donation_lifetime_glory)} glory · {num(m.donation_lifetime_items)} items
                  </div>
                )}
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, color: 'rgba(240,240,248,0.25)', marginTop: 4 }}>
                  Joined {formatDate(m.joined_at)}
                </div>
                {actionable && (
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'rgba(201,169,97,0.5)', marginTop: 4, letterSpacing: '0.08em' }}>
                    MANAGE →
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
        {emptySlots > 0 && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.3)', textAlign: 'center', marginTop: 12, letterSpacing: '0.08em' }}>
            + {emptySlots} empty {emptySlots === 1 ? 'slot' : 'slots'}
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          {confirmLeave ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.6)' }}>
                {myRank === 'founder' ? 'Leaving passes the banner on. Confirm?' : 'Leave the alliance? A 24h cooldown applies.'}
              </span>
              <GoldButton danger small onClick={onLeave} disabled={busy}>Confirm leave</GoldButton>
              <GoldButton small onClick={() => setConfirmLeave(false)} disabled={busy}>Cancel</GoldButton>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <GoldButton danger small onClick={() => setConfirmLeave(true)} disabled={busy}>↩ Leave Alliance</GoldButton>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Treasury (war chest) ── */}
      <motion.div variants={fadeUp} style={{ marginTop: 24 }}>
        <SectionHeader>WAR CHEST</SectionHeader>
        <Panel style={{ background: 'rgba(201,169,97,0.05)', border: '1px solid rgba(201,169,97,0.22)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, color: '#C9A961', lineHeight: 1, marginBottom: 4 }}>₯</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: '#FFB347', lineHeight: 1 }}>
                {fmt(a.treasury_drachma)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.35)' }}>
                Drachma
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, color: '#FBBF24', lineHeight: 1, marginBottom: 4 }}>✦</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: '#FBBF24', lineHeight: 1 }}>
                {fmt(a.treasury_glory)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.35)' }}>
                Glory
              </div>
            </div>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontStyle: 'italic', color: 'rgba(240,240,248,0.35)', textAlign: 'center', margin: '14px 0 0' }}>
            The war chest is permanent and never withdrawable.
          </p>
          {treasuryLog.length > 0 ? (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {treasuryLog.map(entry => (
                <div key={entry.id} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.35)', lineHeight: 1.4 }}>
                  <span style={{ color: 'rgba(201,169,97,0.6)' }}>{entry.donor_username}</span>
                  {' donated '}
                  {entry.donation_type === 'item'
                    ? <>{entry.item_name || 'item'}{entry.item_rarity ? ` (${entry.item_rarity})` : ''} → {fmt(entry.power_value)} {entry.power_track} power</>
                    : <>{fmt(entry.amount)}{entry.donation_type === 'drachma' ? '₯' : ' glory'} → {fmt(entry.power_value)} {entry.power_track} power</>
                  }
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.22)', textAlign: 'center', margin: '6px 0 0', letterSpacing: '0.05em' }}>
              No donations yet. Be the first to contribute.
            </p>
          )}
        </Panel>
      </motion.div>

      {/* ── Donation ── */}
      <motion.div variants={fadeUp} style={{ marginTop: 24 }}>
        <SectionHeader>MAKE AN OFFERING</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Drachma */}
          <Panel>
            <DonateHeader title="Donate Drachma" balance={`${fmt(playerDrachma)} ₯ available`} track="economic" />
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <input type="number" min={1} max={playerDrachma} value={drachmaAmt} onChange={e => setDrachmaAmt(e.target.value)}
                  placeholder="0" style={donateInputStyle} disabled={busy} />
              </div>
              <GoldButton onClick={() => onDonate('drachma')} disabled={busy || !(parseInt(drachmaAmt, 10) > 0)}>Donate</GoldButton>
            </div>
            <PowerPreview value={drachmaPreview} track="economic" />
          </Panel>
          {/* Glory */}
          <Panel>
            <DonateHeader title="Donate Glory" balance={`${fmt(playerGlory)} ✦ available`} track="economic" />
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <input type="number" min={1} max={playerGlory} value={gloryAmt} onChange={e => setGloryAmt(e.target.value)}
                  placeholder="0" style={donateInputStyle} disabled={busy} />
              </div>
              <GoldButton onClick={() => onDonate('glory')} disabled={busy || !(parseInt(gloryAmt, 10) > 0)}>Donate</GoldButton>
            </div>
            <PowerPreview value={gloryPreview} track="economic" />
          </Panel>
          {/* Item */}
          <Panel>
            <DonateHeader title="Donate Item" balance={`${inventory.length} unequipped`} track="military" />
            {inventory.length === 0 ? (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.4)', margin: '4px 0 0' }}>
                No unequipped items to offer.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <select value={donateItemId} onChange={e => setDonateItemId(e.target.value)} style={donateInputStyle} disabled={busy}>
                      <option value="">Select an item…</option>
                      {inventory.map(i => {
                        const pw = (RARITY_VALUE[i.rarity] || 0) * (num(i.level_required) || 1)
                        return (
                          <option key={i.inventory_id} value={i.inventory_id}>
                            {i.name} ({i.rarity}, lvl {num(i.level_required) || 1}) → {pw} pwr
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <GoldButton onClick={() => onDonate('item')} disabled={busy || !donateItemId}>Donate</GoldButton>
                </div>
                {selectedItem && (
                  <div style={{ marginTop: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: RARITY_COLOR[selectedItem.rarity] || '#B0B0B0' }}>
                    {selectedItem.name}
                  </div>
                )}
                <PowerPreview value={itemPreview} track="military" />
              </>
            )}
          </Panel>
        </div>
      </motion.div>

      {/* ── Management (founder/officer) ── */}
      {isOfficerPlus && (
        <motion.div variants={fadeUp} style={{ marginTop: 24 }}>
          <SectionHeader>BANNER MANAGEMENT</SectionHeader>
          <Panel>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A961', marginBottom: 10 }}>
              Invite a Warrior
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Warrior username"
                  style={donateInputStyle} disabled={inviting}
                  onKeyDown={e => { if (e.key === 'Enter') onInvite() }} />
              </div>
              <GoldButton onClick={onInvite} disabled={inviting || !inviteName.trim()}>{inviting ? '…' : 'Send'}</GoldButton>
            </div>
            {inviteMsg && (
              <div style={{ marginTop: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: inviteMsg.kind === 'error' ? '#E0655A' : '#5FB857' }}>
                {inviteMsg.text}
              </div>
            )}
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.3)', marginTop: 8 }}>
              Warriors must be level {MIN_INVITE_LEVEL}+ and unaffiliated.
            </div>
          </Panel>

          <Panel style={{ marginTop: 10 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A961', marginBottom: 10 }}>
              Outgoing Invites ({invitesSent.length})
            </div>
            {invitesSent.length === 0 ? (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.4)', margin: 0 }}>
                No pending invites.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {invitesSent.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#EDE3CC' }}>{inv.invitee_username}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.3)', marginLeft: 8 }}>
                        by {inv.inviter_username}
                      </span>
                    </div>
                    <GoldButton danger small onClick={() => onCancelInvite(inv.id)} disabled={busy}>Cancel</GoldButton>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {myRank === 'founder' && (
            <Panel style={{ marginTop: 10, borderColor: 'rgba(224,101,90,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E0655A', marginBottom: 2 }}>
                    Disband Alliance
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.35)' }}>
                    Permanent. The war chest is lost.
                  </div>
                </div>
                <GoldButton danger onClick={onDisbandOpen} disabled={busy}>✕ Disband</GoldButton>
              </div>
            </Panel>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── IN_ALLIANCE sub-bits ─────────────────────────────────────────────────────

const donateInputStyle = {
  width: '100%', boxSizing: 'border-box',
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#EDE3CC',
  background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,169,97,0.28)',
  borderRadius: 6, padding: '10px 12px', outline: 'none',
}

function DonateHeader({ title, balance, track }) {
  const c = CREST[track]
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.main }}>
        {title}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.4)' }}>
        {balance}
      </span>
    </div>
  )
}

function PowerPreview({ value, track }) {
  const c = CREST[track]
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: value > 0 ? c.bright : 'rgba(240,240,248,0.3)', marginTop: 6, letterSpacing: '0.04em' }}>
      → +{fmt(value)} {track === 'military' ? 'military' : 'economic'} power
    </div>
  )
}

function BreakdownGroup({ title, color, rows }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 12px' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color, marginBottom: 8 }}>
        {title}
      </div>
      {rows.map(([label, value], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.45)' }}>{label}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.75)' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

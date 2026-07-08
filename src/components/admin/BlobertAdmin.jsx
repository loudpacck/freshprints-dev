import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { usePolling } from '@/hooks/usePolling'
import StatCard from './StatCard'
import ChartCard from './ChartCard'

// Source colors reference theme tokens first, with the documented design-system
// hex only as a var() fallback (same pattern Blobert's skins use).
const SOURCE_META = {
  ai:          { label: 'AI',           color: 'var(--color-accent-violet, #8B5CF6)' },
  cache:       { label: 'Cache',        color: 'var(--color-accent-primary, #00C8FF)' },
  fuzzy:       { label: 'Fuzzy',        color: 'var(--color-accent-secondary, #FFB347)' },
  ratelimited: { label: 'Rate-limited', color: 'var(--color-status-warning, #F59E0B)' },
  capped:      { label: 'Capped',       color: 'var(--color-status-error, #EF4444)' },
}
const SOURCE_ORDER = ['cache', 'fuzzy', 'ai', 'ratelimited', 'capped']

const TOOLTIP_STYLE = {
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-default)',
  borderRadius: '4px',
  fontFamily: 'IBM Plex Mono',
  fontSize: 11,
  color: 'var(--color-text-primary)',
}

function formatDay(day) {
  if (!day) return ''
  const d = new Date(day)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatWhen(ts) {
  if (!ts) return '—'
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

const mono = (extra = {}) => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-wider)',
  ...extra,
})

function SourceBadge({ source }) {
  const meta = SOURCE_META[source] || { label: source, color: 'var(--color-text-muted)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px', borderRadius: 999,
      border: `1px solid ${meta.color}`, color: meta.color, fontFamily: 'var(--font-mono)', fontSize: 10,
      textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
      {meta.label}
    </span>
  )
}

// --- Inline transcript for one session --------------------------------------

function SessionTranscript({ sessionId }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setRows(null)
    setError('')
    fetch(`/api/admin/overview?section=blobert&session=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) (d.error ? setError(d.error) : setRows(d.transcript || [])) })
      .catch(() => { if (!cancelled) setError('Network error') })
    return () => { cancelled = true }
  }, [sessionId])

  if (error) return <p style={mono({ color: 'rgb(239,68,68)', padding: 'var(--space-4)' })}>// {error}</p>
  if (!rows) return <p style={mono({ color: 'var(--color-text-muted)', padding: 'var(--space-4)' })}>LOADING TRANSCRIPT…</p>
  if (rows.length === 0) return <p style={mono({ color: 'var(--color-text-muted)', padding: 'var(--space-4)' })}>// EMPTY</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-5)', background: 'var(--color-bg-base)', borderTop: '1px solid var(--color-border-subtle)' }}>
      {rows.map((m, i) => {
        const isUser = m.role === 'user'
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
            <div style={{
              maxWidth: '80%', padding: 'var(--space-3) var(--space-4)', borderRadius: 10,
              background: isUser ? 'rgba(0,200,255,0.08)' : 'var(--color-bg-elevated)',
              border: `1px solid ${isUser ? 'rgba(0,200,255,0.25)' : 'var(--color-border-default)'}`,
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
              lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {m.content}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={mono({ color: 'var(--color-text-muted)', fontSize: 10, textTransform: 'uppercase' })}>{m.role}</span>
              {!isUser && m.answered_by && <SourceBadge source={m.answered_by} />}
              {m.theme && <span style={mono({ color: 'var(--color-text-muted)', fontSize: 10 })}>{m.theme}</span>}
              {m.tone && <span style={mono({ color: 'var(--color-text-muted)', fontSize: 10 })}>· {m.tone}</span>}
              <span style={mono({ color: 'var(--color-text-muted)', fontSize: 10, opacity: 0.7 })}>{formatWhen(m.created_at)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Main tab ----------------------------------------------------------------

export default function BlobertAdmin({ refreshKey = 0, onLastUpdated }) {
  const [expanded, setExpanded] = useState(null)

  const fetchStats = useCallback(async () => {
    const r = await fetch('/api/admin/overview?section=blobert')
    const d = await r.json()
    if (d.error) throw new Error(d.error)
    return d
  }, [])

  const { data, loading, error, lastUpdated } = usePolling(fetchStats, 30000, refreshKey)

  useEffect(() => {
    if (lastUpdated && onLastUpdated) onLastUpdated(lastUpdated)
  }, [lastUpdated, onLastUpdated])

  const chartData = useMemo(() => {
    if (!data?.dailyVolume) return []
    const days = {}
    for (const { day, answered_by, count } of data.dailyVolume) {
      const key = new Date(day).toISOString().slice(0, 10)
      if (!days[key]) days[key] = { day, cache: 0, fuzzy: 0, ai: 0, ratelimited: 0, capped: 0 }
      if (answered_by in days[key]) days[key][answered_by] = count
    }
    return Object.values(days).sort((a, b) => new Date(a.day) - new Date(b.day))
  }, [data])

  const cacheHitRate = useMemo(() => {
    const s = data?.last24h
    if (!s) return '—'
    const answered = s.cache + s.fuzzy + s.ai
    if (answered === 0) return '0%'
    return `${Math.round(((s.cache + s.fuzzy) / answered) * 100)}%`
  }, [data])

  if (error) {
    return <p style={mono({ color: 'rgb(239,68,68)' })}>// ERROR: {error}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <p style={mono({ color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 0 })}>// BLOBERT</p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Chats (24h)" value={data?.chats24h ?? 0} loading={loading} />
        <StatCard
          label="AI Calls Today"
          value={loading ? '—' : `${data?.aiToday ?? 0} / ${data?.dailyCap ?? 1000}`}
          loading={false}
          accent="var(--color-accent-violet, #8B5CF6)"
          sub="daily global cap"
        />
        <StatCard label="Cache-Hit Rate (24h)" value={loading ? '—' : cacheHitRate} loading={false} sub="cache + fuzzy / answered" />
        <StatCard label="Rate-Limited (24h)" value={data?.last24h?.ratelimited ?? 0} loading={loading} accent="var(--color-status-warning, #F59E0B)" />
      </div>

      {/* 30-day volume chart, split by source */}
      <ChartCard title="DAILY MESSAGE VOLUME — LAST 30 DAYS" height={220}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={mono({ color: 'var(--color-text-muted)' })}>LOADING...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={mono({ color: 'var(--color-text-muted)' })}>// NO DATA YET</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" tickFormatter={formatDay} tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDay} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              {SOURCE_ORDER.map(k => (
                <Bar key={k} dataKey={k} name={SOURCE_META[k].label} stackId="v" fill={SOURCE_META[k].color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Recent sessions */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <p style={mono({ color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: 'var(--space-5) var(--space-6) 0' })}>
          // RECENT SESSIONS
        </p>
        {loading ? (
          <p style={mono({ color: 'var(--color-text-muted)', padding: 'var(--space-6)' })}>LOADING...</p>
        ) : (data?.sessions ?? []).length === 0 ? (
          <p style={mono({ color: 'var(--color-text-muted)', padding: 'var(--space-6)' })}>// NO SESSIONS YET</p>
        ) : (
          <div style={{ padding: 'var(--space-4) 0' }}>
            {data.sessions.map(s => {
              const isOpen = expanded === s.session_id
              return (
                <div key={s.session_id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : s.session_id)}
                    style={{
                      width: '100%', textAlign: 'left', background: isOpen ? 'rgba(0,200,255,0.05)' : 'transparent',
                      border: 'none', borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer',
                      padding: 'var(--space-3) var(--space-6)', display: 'grid',
                      gridTemplateColumns: 'minmax(0,1fr) auto', gap: 'var(--space-3)', alignItems: 'center',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.first_message || '(no message)'}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={mono({ color: 'var(--color-accent-primary)', fontSize: 10 })}>{s.turns} turn{s.turns === 1 ? '' : 's'}</span>
                        {s.sources.map(src => <SourceBadge key={src} source={src} />)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                      <span style={mono({ color: 'var(--color-text-muted)', fontSize: 10, whiteSpace: 'nowrap' })}>{formatWhen(s.last_activity)}</span>
                      <span style={{ color: 'var(--color-accent-primary)', fontSize: 12, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }}>▸</span>
                    </div>
                  </button>
                  {isOpen && <SessionTranscript sessionId={s.session_id} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

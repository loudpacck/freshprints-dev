import { useCallback, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { usePolling } from '@/hooks/usePolling'
import StatCard from './StatCard'
import ChartCard from './ChartCard'

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

function formatTimestamp(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminOverview({ refreshKey = 0, onLastUpdated }) {
  const fetchSite = useCallback(async () => {
    const r = await fetch('/api/admin/overview')
    const d = await r.json()
    if (d.error) throw new Error(d.error)
    return d
  }, [])

  const fetchGame = useCallback(async () => {
    const r = await fetch('/api/games/pantheon-wars/game?action=admin_metrics')
    const d = await r.json()
    if (d.error) throw new Error(d.error)
    return d
  }, [])

  const { data: site, loading: siteLoading, error: siteError, lastUpdated } = usePolling(fetchSite, 30000, refreshKey)
  const { data: game, loading: gameLoading } = usePolling(fetchGame, 30000, refreshKey)

  useEffect(() => {
    if (lastUpdated && onLastUpdated) onLastUpdated(lastUpdated)
  }, [lastUpdated, onLastUpdated])

  if (siteError) {
    return (
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'rgb(239,68,68)', letterSpacing: 'var(--tracking-wider)' }}>
        // ERROR: {siteError}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Primary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Visitors"      value={site?.visitorsTotal ?? 0}    loading={siteLoading} />
        <StatCard label="Page Views Today"    value={site?.pageViewsToday ?? 0}   loading={siteLoading} />
        <StatCard label="Total Players"       value={game?.totalPlayers ?? 0}     loading={gameLoading} accent="#FFB347" />
        <StatCard label="Active Players (24h)"value={game?.activePlayers24h ?? 0} loading={gameLoading} accent="#FFB347" />
      </div>

      {/* Secondary mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="PvP Fights Today"    value={game?.pvpFightsToday ?? 0}    loading={gameLoading} accent="#8B5CF6" />
        <StatCard label="Chat Messages Today" value={game?.chatMessagesToday ?? 0} loading={gameLoading} accent="#8B5CF6" />
      </div>

      {/* 30-day page views */}
      <ChartCard title="DAILY TRAFFIC — LAST 30 DAYS" height={200}>
        {siteLoading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={site?.dailyChart ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ovGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00C8FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C8FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" tickFormatter={formatDay} tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDay} formatter={v => [v, 'views']} />
              <Area type="monotone" dataKey="views" stroke="#00C8FF" strokeWidth={2} fill="url(#ovGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Bottom: top paths + recent events */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }} className="admin-bottom-grid">
        {/* Top paths */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-4)' }}>
            // TOP PATHS
          </p>
          {siteLoading ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
          ) : (site?.topPaths ?? []).length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>// NO DATA YET</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {(site?.topPaths ?? []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-wider)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 'var(--space-3)' }}>
                    {item.path || '/'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-accent-primary)', letterSpacing: 'var(--tracking-wider)', flexShrink: 0 }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent events */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', overflow: 'hidden' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-4)' }}>
            // RECENT EVENTS
          </p>
          {siteLoading ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
          ) : (site?.recentEvents ?? []).length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>// NO DATA YET</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 340, overflowY: 'auto' }}>
              {(site?.recentEvents ?? []).map((ev, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-2)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-subtle)', alignItems: 'start' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-accent-primary)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginRight: 'var(--space-2)' }}>
                      {ev.event_type}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)' }}>
                      {ev.path || '—'}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', whiteSpace: 'nowrap', opacity: 0.7 }}>
                    {formatTimestamp(ev.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .admin-bottom-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

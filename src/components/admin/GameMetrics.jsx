import { useCallback, useEffect } from 'react'
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
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

const TICK = { fontFamily: 'IBM Plex Mono', fontSize: 10, fill: 'var(--color-text-muted)' }
const GRID = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

const FACTION_COLORS  = { olympians: '#00C8FF', aesir: '#FFB347', annunaki: '#8B5CF6' }
const CLASS_COLORS    = { warden: '#22C55E', oracle: '#8B5CF6', slayer: '#EF4444', broker: '#F59E0B' }
const TITAN_STATUS_COLORS = { queue: '#FFB347', active: '#22C55E', completed: '#00C8FF', failed: '#EF4444' }

const tdStyle = {
  fontFamily: 'IBM Plex Mono',
  fontSize: 11,
  color: 'var(--color-text-secondary, var(--color-text-muted))',
  padding: '7px 10px',
  borderBottom: '1px solid var(--color-border-subtle)',
  verticalAlign: 'middle',
}

function PieLegend({ data, colorMap }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-3)', justifyContent: 'center' }}>
      {data.map((entry, i) => {
        const key = entry.faction || entry.class
        const color = colorMap[key] || '#606080'
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)' }}>
              {key} ({entry.count})
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function GameMetrics({ refreshKey = 0, onLastUpdated }) {
  const fetchGame = useCallback(async () => {
    const r = await fetch('/api/games/pantheon-wars/game?action=admin_metrics')
    const d = await r.json()
    if (d.error) throw new Error(d.error)
    return d
  }, [])

  const { data, loading, error, lastUpdated } = usePolling(fetchGame, 30000, refreshKey)

  useEffect(() => {
    if (lastUpdated && onLastUpdated) onLastUpdated(lastUpdated)
  }, [lastUpdated, onLastUpdated])

  if (error) {
    return (
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'rgb(239,68,68)', letterSpacing: 'var(--tracking-wider)' }}>
        // ERROR: {error}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Stat cards row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Players"          value={data?.totalPlayers ?? 0}          loading={loading} accent="#FFB347" />
        <StatCard label="New Today"              value={data?.newPlayersToday ?? 0}        loading={loading} accent="#FFB347" />
        <StatCard label="Active (24h)"           value={data?.activePlayers24h ?? 0}       loading={loading} accent="#FFB347" />
        <StatCard label="Quest Completions"      value={data?.questCompletionsTotal ?? 0}  loading={loading} accent="#FFB347" />
      </div>

      {/* Stat cards row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="PvP Fights Today"   value={data?.pvpFightsToday ?? 0}   loading={loading} accent="#8B5CF6" />
        <StatCard label="PvP Fights Total"   value={data?.pvpFightsTotal ?? 0}   loading={loading} accent="#8B5CF6" />
        <StatCard label="Chat Today"         value={data?.chatMessagesToday ?? 0} loading={loading} accent="#8B5CF6" />
        <StatCard label="Active Mods"        value={data?.activeModerations ?? 0} loading={loading} accent="#8B5CF6" />
      </div>

      {/* Level distribution */}
      <ChartCard title="LEVEL DISTRIBUTION" height={220}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
          </div>
        ) : (data?.levelDistribution ?? []).length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>// NO PLAYERS YET</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.levelDistribution ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              {GRID}
              <XAxis dataKey="level" tick={TICK} tickLine={false} axisLine={false} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v, 'players']} labelFormatter={v => `Level ${v}`} />
              <Bar dataKey="count" fill="#FFB347" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Faction + Class pie charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }} className="gm-two-col">
        {/* Faction */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-4)', marginTop: 0 }}>
            // FACTION DISTRIBUTION
          </p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.factionDistribution ?? []}
                  dataKey="count"
                  nameKey="faction"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={35}
                >
                  {(data?.factionDistribution ?? []).map((entry, i) => (
                    <Cell key={i} fill={FACTION_COLORS[entry.faction] || '#606080'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [v, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <PieLegend data={data?.factionDistribution ?? []} colorMap={FACTION_COLORS} />
        </div>

        {/* Class */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-4)', marginTop: 0 }}>
            // CLASS DISTRIBUTION
          </p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.classDistribution ?? []}
                  dataKey="count"
                  nameKey="class"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={35}
                >
                  {(data?.classDistribution ?? []).map((entry, i) => (
                    <Cell key={i} fill={CLASS_COLORS[entry.class] || '#606080'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [v, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <PieLegend data={data?.classDistribution ?? []} colorMap={CLASS_COLORS} />
        </div>
      </div>

      {/* Economy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', margin: 0 }}>
          // ECONOMY
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }} className="gm-two-col">
          <StatCard label="Total Drachma in Economy" value={data?.totalDrachma ?? 0} loading={loading} accent="#F59E0B" />
          <StatCard label="Avg Drachma Per Player"   value={data?.avgDrachma ?? 0}   loading={loading} accent="#F59E0B" />
        </div>
        {/* Top 10 richest table */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', overflowX: 'auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-4)', marginTop: 0 }}>
            // TOP 10 RICHEST PLAYERS
          </p>
          {loading ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
          ) : (data?.topRichest ?? []).length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>// NO PLAYERS YET</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Username', 'Level', 'Drachma'].map(h => (
                    <th key={h} style={{ ...tdStyle, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', textAlign: 'left', padding: '4px 10px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.topRichest ?? []).map((p, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-primary)' }}>{p.username}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-accent-primary)' }}>{p.level}</td>
                    <td style={{ ...tdStyle, color: '#F59E0B' }}>{p.drachma.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Titan Events */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-4)', marginTop: 0 }}>
          // TITAN EVENTS
        </p>
        {loading ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
        ) : (data?.titanEvents ?? []).length === 0 ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>// NO TITAN EVENTS YET</p>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {(data?.titanEvents ?? []).map((ev, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-bg-base)',
                border: `1px solid ${TITAN_STATUS_COLORS[ev.status] || '#606080'}40`,
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: TITAN_STATUS_COLORS[ev.status] || '#606080' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase' }}>
                  {ev.status}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: TITAN_STATUS_COLORS[ev.status] || '#606080', letterSpacing: 'var(--tracking-wide)', lineHeight: 1 }}>
                  {ev.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .gm-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

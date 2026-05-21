import { useCallback, useEffect } from 'react'
import {
  AreaChart, Area,
  LineChart, Line,
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

const DEVICE_COLORS = { desktop: '#00C8FF', mobile: '#FFB347', tablet: '#8B5CF6', unknown: '#606080' }
const BROWSER_COLORS = ['#00C8FF', '#FFB347', '#8B5CF6', '#22C55E', '#F87171', '#A0A0B8', '#FBBF24', '#60A5FA']

function formatDay(v) {
  if (!v) return ''
  const d = new Date(v)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function SiteAnalytics({ refreshKey = 0, onLastUpdated }) {
  const fetchSite = useCallback(async () => {
    const r = await fetch('/api/admin/overview')
    const d = await r.json()
    if (d.error) throw new Error(d.error)
    return d
  }, [])

  const { data, loading, error, lastUpdated } = usePolling(fetchSite, 30000, refreshKey)

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
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Visitors"   value={data?.visitorsTotal ?? 0}   loading={loading} />
        <StatCard label="Total Sessions"   value={data?.sessionsTotal ?? 0}   loading={loading} />
        <StatCard label="Page Views Today" value={data?.pageViewsToday ?? 0}  loading={loading} />
        <StatCard label="Page Views Total" value={data?.pageViewsTotal ?? 0}  loading={loading} />
      </div>

      {/* Two charts side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }} className="analytics-two-col">
        {/* 30-day page views */}
        <ChartCard title="PAGE VIEWS — 30 DAYS" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.dailyChart ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="saGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00C8FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C8FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              {GRID}
              <XAxis dataKey="day" tickFormatter={formatDay} tick={TICK} tickLine={false} axisLine={false} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDay} formatter={v => [v, 'views']} />
              <Area type="monotone" dataKey="views" stroke="#00C8FF" strokeWidth={2} fill="url(#saGrad1)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 30-day unique visitors */}
        <ChartCard title="UNIQUE VISITORS — 30 DAYS" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.dailyUniqueVisitors ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              {GRID}
              <XAxis dataKey="day" tickFormatter={formatDay} tick={TICK} tickLine={false} axisLine={false} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDay} formatter={v => [v, 'unique visitors']} />
              <Line type="monotone" dataKey="unique_visitors" stroke="#FFB347" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top 10 pages horizontal bar */}
      <ChartCard title="TOP 10 PAGES" height={280}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data?.topPaths ?? []}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              {GRID}
              <XAxis type="number" tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                dataKey="path"
                type="category"
                width={140}
                tick={{ ...TICK, fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v?.length > 22 ? v.slice(0, 22) + '…' : (v || '/')}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v, 'views']} />
              <Bar dataKey="count" fill="#00C8FF" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Device + Browser side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }} className="analytics-two-col">
        {/* Device type pie */}
        <ChartCard title="DEVICE TYPE" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.deviceBreakdown ?? []}
                dataKey="count"
                nameKey="device_type"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
              >
                {(data?.deviceBreakdown ?? []).map((entry, i) => (
                  <Cell key={i} fill={DEVICE_COLORS[entry.device_type] || '#606080'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v, name) => [v, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-3)', justifyContent: 'center' }}>
            {(data?.deviceBreakdown ?? []).map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: DEVICE_COLORS[entry.device_type] || '#606080', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)' }}>
                  {entry.device_type} ({entry.count})
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Browser distribution bar */}
        <ChartCard title="BROWSERS" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data?.browserBreakdown ?? []}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                dataKey="browser"
                type="category"
                width={80}
                tick={{ ...TICK, fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v?.length > 12 ? v.slice(0, 12) + '…' : (v || '?')}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v, 'sessions']} />
              <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                {(data?.browserBreakdown ?? []).map((_, i) => (
                  <Cell key={i} fill={BROWSER_COLORS[i % BROWSER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top referrers table */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-4)' }}>
          // TOP REFERRERS
        </p>
        {loading ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
        ) : (data?.topReferrers ?? []).length === 0 ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>// NO REFERRER DATA YET</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {(data?.topReferrers ?? []).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-wider)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 'var(--space-3)' }}>
                  {item.referrer}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-accent-primary)', letterSpacing: 'var(--tracking-wider)', flexShrink: 0 }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .analytics-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

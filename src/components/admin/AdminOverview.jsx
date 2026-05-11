import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function StatCard({ label, value, loading }) {
  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-4xl)',
        color: 'var(--color-accent-primary)',
        letterSpacing: 'var(--tracking-wide)',
        lineHeight: 1,
      }}>
        {loading ? '—' : value.toLocaleString()}
      </p>
    </div>
  )
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

export default function AdminOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/admin/overview')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'rgb(239,68,68)',
        letterSpacing: 'var(--tracking-wider)',
      }}>
        // ERROR: {error}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        <StatCard label="Total Page Views" value={data?.pageViewsTotal ?? 0} loading={loading} />
        <StatCard label="Page Views Today" value={data?.pageViewsToday ?? 0} loading={loading} />
        <StatCard label="Total Visitors" value={data?.visitorsTotal ?? 0} loading={loading} />
        <StatCard label="Total Sessions" value={data?.sessionsTotal ?? 0} loading={loading} />
      </div>

      {/* Daily chart */}
      <div style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
      }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-4)',
        }}>
          // DAILY TRAFFIC — LAST 30 DAYS
        </p>
        {loading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              LOADING...
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.dailyChart ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C8FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C8FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="day"
                tickFormatter={formatDay}
                tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: 'var(--color-text-muted)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: 'var(--color-text-muted)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: '4px',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 11,
                  color: 'var(--color-text-primary)',
                }}
                labelFormatter={formatDay}
                formatter={v => [v, 'views']}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#00C8FF"
                strokeWidth={2}
                fill="url(#chartGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-6)',
      }}>
        {/* Top paths */}
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-4)',
          }}>
            // TOP PATHS
          </p>
          {loading ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
          ) : (data?.topPaths ?? []).length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>// NO DATA YET</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {(data?.topPaths ?? []).map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-2) 0',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-primary)',
                    letterSpacing: 'var(--tracking-wider)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    marginRight: 'var(--space-3)',
                  }}>
                    {item.path || '/'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-accent-primary)',
                    letterSpacing: 'var(--tracking-wider)',
                    flexShrink: 0,
                  }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent events */}
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          overflow: 'hidden',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-4)',
          }}>
            // RECENT EVENTS
          </p>
          {loading ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
          ) : (data?.recentEvents ?? []).length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>// NO DATA YET</p>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              maxHeight: 340,
              overflowY: 'auto',
            }}>
              {(data?.recentEvents ?? []).map((ev, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) 0',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  alignItems: 'start',
                }}>
                  <div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-accent-primary)',
                      letterSpacing: 'var(--tracking-wider)',
                      textTransform: 'uppercase',
                      marginRight: 'var(--space-2)',
                    }}>
                      {ev.event_type}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      letterSpacing: 'var(--tracking-wider)',
                    }}>
                      {ev.path || '—'}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    letterSpacing: 'var(--tracking-wider)',
                    whiteSpace: 'nowrap',
                    opacity: 0.7,
                  }}>
                    {formatTimestamp(ev.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

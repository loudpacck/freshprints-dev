import {
  XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts'

const ACCURACY_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  accuracy: Math.round((58 + (i / 29) * 8 + Math.sin(i * 0.9) * 2.5) * 10) / 10,
}))

const PICKS = [
  { matchup: 'Lakers @ Celtics',       pick: 'BOS', conf: 72, result: 'HIT' },
  { matchup: 'Bucks @ Heat',           pick: 'MIA', conf: 64, result: 'MISS' },
  { matchup: 'Warriors @ Suns',        pick: 'GSW', conf: 58, result: 'HIT' },
  { matchup: 'Nuggets @ Nets',         pick: 'DEN', conf: 79, result: 'HIT' },
  { matchup: '76ers @ Knicks',         pick: 'NYK', conf: 61, result: 'HIT' },
  { matchup: 'Mavericks @ Clippers',   pick: 'LAC', conf: 68, result: 'HIT' },
  { matchup: 'Thunder @ Rockets',      pick: 'OKC', conf: 74, result: 'HIT' },
  { matchup: 'Pelicans @ Grizzlies',   pick: 'MEM', conf: 56, result: 'PENDING' },
]

const RESULT_COLORS = {
  HIT:     'var(--color-status-active)',
  MISS:    'var(--color-status-error)',
  PENDING: 'var(--color-status-beta)',
}

const RESULT_SYMBOLS = {
  HIT:     '✓ HIT',
  MISS:    '✗ MISS',
  PENDING: 'PENDING',
}

const monoSm = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-wide)',
}

export default function PredictinatorWidget() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40% 60%',
        gap: 'var(--space-6)',
      }}
      className="predictinator-grid"
    >
      {/* Left: Stats panel */}
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-8)',
        }}
      >
        {/* Rolling accuracy */}
        <div>
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            ROLLING ACCURACY
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-5xl)', color: 'var(--color-accent-primary)', lineHeight: 1, margin: 0 }}>
            64.2%
          </p>
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: 'var(--space-1)' }}>
            LAST 30 DAYS
          </p>
        </div>

        {/* Games predicted */}
        <div>
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            GAMES PREDICTED
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-5xl)', color: 'var(--color-text-primary)', lineHeight: 1, margin: 0 }}>
            1,247
          </p>
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: 'var(--space-1)' }}>
            ALL TIME
          </p>
        </div>

        {/* Current streak */}
        <div>
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            CURRENT STREAK
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-5xl)', color: 'var(--color-status-active)', lineHeight: 1, margin: 0 }}>
            8 W
          </p>
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: 'var(--space-1)' }}>
            CORRECT PICKS
          </p>
        </div>

        {/* Accuracy chart */}
        <div>
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            ACCURACY TREND
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={ACCURACY_DATA} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00C8FF" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00C8FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v, i) => (i === 0 || i === 14 || i === 29) ? `D${v}` : ''}
              />
              <YAxis
                domain={[50, 75]}
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}%`}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="#00C8FF"
                strokeWidth={2}
                fill="url(#accGrad)"
                dot={false}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Recent picks */}
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        <p
          style={{
            ...monoSm,
            color: 'var(--color-text-accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
          }}
        >
          // RECENT PICKS
        </p>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['MATCHUP', 'PICK', 'CONFIDENCE', 'RESULT'].map(col => (
                  <th
                    key={col}
                    style={{
                      ...monoSm,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      textAlign: 'left',
                      paddingBottom: 'var(--space-3)',
                      paddingRight: 'var(--space-4)',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PICKS.map((row, i) => (
                <tr key={i}>
                  <td
                    style={{
                      ...monoSm,
                      color: 'var(--color-text-secondary)',
                      padding: 'var(--space-3) var(--space-4) var(--space-3) 0',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.matchup}
                  </td>
                  <td
                    style={{
                      ...monoSm,
                      color: 'var(--color-text-primary)',
                      padding: 'var(--space-3) var(--space-4) var(--space-3) 0',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      fontWeight: 'var(--weight-medium)',
                    }}
                  >
                    {row.pick}
                  </td>
                  <td
                    style={{
                      padding: 'var(--space-3) var(--space-4) var(--space-3) 0',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      minWidth: 120,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: 'var(--color-bg-elevated)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${row.conf}%`,
                            height: '100%',
                            background: 'var(--color-accent-primary)',
                            borderRadius: 'var(--radius-full)',
                          }}
                        />
                      </div>
                      <span style={{ ...monoSm, color: 'var(--color-text-muted)', minWidth: 32 }}>
                        {row.conf}%
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: 'var(--space-3) 0',
                      borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <span
                      style={{
                        ...monoSm,
                        color: RESULT_COLORS[row.result],
                        textTransform: 'uppercase',
                        fontWeight: 'var(--weight-medium)',
                      }}
                    >
                      {RESULT_SYMBOLS[row.result]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border-subtle)',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <span style={{ ...monoSm, color: 'var(--color-text-muted)' }}>
            // MODEL: ENSEMBLE_V2.4 // LAST UPDATED: 2026.05.08
          </span>
          <button
            style={{
              ...monoSm,
              color: 'var(--color-accent-primary)',
              background: 'transparent',
              border: '1px solid var(--color-accent-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-2) var(--space-4)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            REQUEST API ACCESS →
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .predictinator-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

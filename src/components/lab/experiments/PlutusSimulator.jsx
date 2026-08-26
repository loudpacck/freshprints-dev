import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import Button from '@/components/ui/Button'
import LoadingDot from '@/components/ui/LoadingDot'

function lcg(seed) {
  let s = (seed * 1664525 + 1013904223) & 0x7fffffff
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function generateCurve({ seed, trend, volatility, points, endReturn }) {
  const rand = lcg(seed)
  const data = []
  let value = 0
  const dailyTrend = endReturn / points

  for (let i = 0; i < points; i++) {
    value += dailyTrend + (rand() - 0.5) * volatility
    data.push({
      index: i,
      value: Math.round(value * 100) / 100,
    })
  }
  return data
}

const STRATEGY_CONFIGS = {
  'mean-reversion':      { seed: 1001, volatility: 1.4, label: 'Smooth, range-bound gains' },
  'momentum':            { seed: 2002, volatility: 3.2, label: 'Strong directional runs' },
  'volatility-breakout': { seed: 3003, volatility: 5.8, label: 'High-variance, explosive' },
  'composite':           { seed: 4004, volatility: 1.0, label: 'Best risk-adjusted returns' },
}

const STRATEGY_RESULTS = {
  'mean-reversion': {
    '30d':  { return: '+8.4%',  winRate: '61%', trades: 45,  drawdown: '-3.2%',  sharpe: '1.82', sortino: '2.41', avgDur: '2.1d', bigWin: '+4.2%', bigLoss: '-2.1%', profitFactor: '2.1' },
    '90d':  { return: '+22.7%', winRate: '59%', trades: 138, drawdown: '-6.8%',  sharpe: '1.74', sortino: '2.28', avgDur: '2.3d', bigWin: '+5.8%', bigLoss: '-3.4%', profitFactor: '1.9' },
    '1y':   { return: '+47.2%', winRate: '58%', trades: 342, drawdown: '-12.4%', sharpe: '1.61', sortino: '2.09', avgDur: '2.5d', bigWin: '+8.1%', bigLoss: '-5.6%', profitFactor: '1.8' },
    '5y':   { return: '+184%',  winRate: '56%', trades: 1820,drawdown: '-18.3%', sharpe: '1.43', sortino: '1.87', avgDur: '2.7d', bigWin: '+12.4%',bigLoss: '-8.2%', profitFactor: '1.7' },
  },
  'momentum': {
    '30d':  { return: '+11.2%', winRate: '52%', trades: 28,  drawdown: '-5.4%',  sharpe: '1.44', sortino: '1.89', avgDur: '4.8d', bigWin: '+9.3%', bigLoss: '-4.8%', profitFactor: '2.4' },
    '90d':  { return: '+31.6%', winRate: '54%', trades: 81,  drawdown: '-9.1%',  sharpe: '1.52', sortino: '1.98', avgDur: '5.1d', bigWin: '+14.7%',bigLoss: '-6.3%', profitFactor: '2.6' },
    '1y':   { return: '+68.3%', winRate: '53%', trades: 204, drawdown: '-19.8%', sharpe: '1.38', sortino: '1.74', avgDur: '5.4d', bigWin: '+21.2%',bigLoss: '-9.7%', profitFactor: '2.5' },
    '5y':   { return: '+312%',  winRate: '51%', trades: 1050,drawdown: '-31.4%', sharpe: '1.21', sortino: '1.58', avgDur: '5.8d', bigWin: '+38.4%',bigLoss: '-15.3%',profitFactor: '2.3' },
  },
  'volatility-breakout': {
    '30d':  { return: '+14.7%', winRate: '44%', trades: 19,  drawdown: '-8.3%',  sharpe: '1.18', sortino: '1.62', avgDur: '1.4d', bigWin: '+18.6%',bigLoss: '-7.2%', profitFactor: '2.8' },
    '90d':  { return: '+38.2%', winRate: '46%', trades: 54,  drawdown: '-14.6%', sharpe: '1.24', sortino: '1.71', avgDur: '1.6d', bigWin: '+24.3%',bigLoss: '-10.4%',profitFactor: '2.9' },
    '1y':   { return: '+82.1%', winRate: '45%', trades: 143, drawdown: '-26.7%', sharpe: '1.09', sortino: '1.48', avgDur: '1.8d', bigWin: '+31.8%',bigLoss: '-13.9%',profitFactor: '2.7' },
    '5y':   { return: '+428%',  winRate: '43%', trades: 740, drawdown: '-42.1%', sharpe: '0.94', sortino: '1.29', avgDur: '2.0d', bigWin: '+58.4%',bigLoss: '-22.1%',profitFactor: '2.5' },
  },
  'composite': {
    '30d':  { return: '+9.8%',  winRate: '63%', trades: 38,  drawdown: '-2.4%',  sharpe: '2.14', sortino: '2.88', avgDur: '3.2d', bigWin: '+6.4%', bigLoss: '-1.8%', profitFactor: '2.9' },
    '90d':  { return: '+27.4%', winRate: '62%', trades: 112, drawdown: '-4.9%',  sharpe: '2.08', sortino: '2.79', avgDur: '3.4d', bigWin: '+9.2%', bigLoss: '-2.9%', profitFactor: '3.1' },
    '1y':   { return: '+59.8%', winRate: '61%', trades: 278, drawdown: '-8.6%',  sharpe: '1.96', sortino: '2.63', avgDur: '3.7d', bigWin: '+13.7%',bigLoss: '-4.8%', profitFactor: '3.2' },
    '5y':   { return: '+247%',  winRate: '60%', trades: 1420,drawdown: '-13.2%', sharpe: '1.87', sortino: '2.51', avgDur: '4.0d', bigWin: '+22.1%',bigLoss: '-8.4%', profitFactor: '3.4' },
  },
}

const PERIOD_POINTS = { '30d': 30, '90d': 90, '1y': 252, '5y': 1260 }
const PERIOD_LABELS = { '30d': '30D', '90d': '90D', '1y': '1Y', '5y': '5Y' }

const STRATEGIES = [
  { id: 'mean-reversion',      label: 'MEAN REVERSION' },
  { id: 'momentum',            label: 'MOMENTUM' },
  { id: 'volatility-breakout', label: 'VOLATILITY BREAKOUT' },
  { id: 'composite',           label: 'COMPOSITE' },
]

const PERIODS = ['30d', '90d', '1y', '5y']

const monoSm = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-wide)',
}

function ToggleButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...monoSm,
        padding: 'var(--space-2) var(--space-4)',
        background: active ? 'var(--color-accent-primary)' : 'transparent',
        color: active ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
        border: `1px solid ${active ? 'var(--color-accent-primary)' : 'var(--color-border-subtle)'}`,
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        transition: 'all var(--duration-base)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function StatCard({ label, value, valueColor }) {
  return (
    <div
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
      }}
    >
      <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          color: valueColor || 'var(--color-text-primary)',
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default function PlutusSimulator() {
  const [selectedStrategy, setSelectedStrategy] = useState('mean-reversion')
  const [selectedPeriod, setSelectedPeriod] = useState('1y')
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState(null)

  function runSimulation() {
    setIsRunning(true)
    setTimeout(() => {
      const cfg = STRATEGY_CONFIGS[selectedStrategy]
      const pts = PERIOD_POINTS[selectedPeriod]
      const res = STRATEGY_RESULTS[selectedStrategy][selectedPeriod]
      const returnNum = parseFloat(res.return.replace('+', '').replace('%', ''))

      const chartData = generateCurve({
        seed: cfg.seed + PERIODS.indexOf(selectedPeriod) * 100,
        volatility: cfg.volatility,
        points: Math.min(pts, 120),
        endReturn: returnNum,
      })

      setResults({ ...res, chartData })
      setIsRunning(false)
    }, 1500)
  }

  const totalReturnPositive = results ? !results.return.startsWith('-') : true
  const gradientId = `plutusGrad_${selectedStrategy}_${selectedPeriod}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Simulated-data banner */}
      <div
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          borderLeft: '3px solid var(--color-status-beta)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4) var(--space-5)',
        }}
      >
        <p style={{ ...monoSm, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 'var(--leading-normal)' }}>
          // SIMULATED: Every curve and figure here is generated from synthetic data to
          demonstrate the analysis interface. No real market data is backtested.
        </p>
      </div>

      {/* Control bar */}
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'var(--space-6)',
          flexWrap: 'wrap',
        }}
      >
        {/* Strategy selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Strategy</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {STRATEGIES.map(s => (
              <ToggleButton
                key={s.id}
                label={s.label}
                active={selectedStrategy === s.id}
                onClick={() => setSelectedStrategy(s.id)}
              />
            ))}
          </div>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Period</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {PERIODS.map(p => (
              <ToggleButton
                key={p}
                label={PERIOD_LABELS[p]}
                active={selectedPeriod === p}
                onClick={() => setSelectedPeriod(p)}
              />
            ))}
          </div>
        </div>

        {/* Run button */}
        <div style={{ marginLeft: 'auto' }}>
          <Button
            variant="primary"
            onClick={runSimulation}
            disabled={isRunning}
            icon={isRunning ? <LoadingDot size={6} color="var(--color-text-inverse)" /> : null}
          >
            {isRunning ? 'COMPUTING...' : 'RUN SIMULATION'}
          </Button>
        </div>
      </div>

      {/* Results */}
      {!results && !isRunning && (
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-16)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="28" width="6" height="8" rx="1" fill="var(--color-text-muted)" />
            <rect x="14" y="20" width="6" height="16" rx="1" fill="var(--color-text-muted)" />
            <rect x="24" y="12" width="6" height="24" rx="1" fill="var(--color-text-muted)" />
            <rect x="34" y="6" width="6" height="30" rx="1" fill="var(--color-text-muted)" />
          </svg>
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>
            // SELECT STRATEGY AND PRESS RUN SIMULATION
          </p>
        </div>
      )}

      {isRunning && (
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-16)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <LoadingDot />
          <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            // RUNNING SIMULATION...
          </p>
        </div>
      )}

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Top stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }} className="plutus-stats-grid">
            <StatCard label="TOTAL RETURN" value={results.return} valueColor={totalReturnPositive ? 'var(--color-status-active)' : 'var(--color-status-error)'} />
            <StatCard label="WIN RATE" value={results.winRate} />
            <StatCard label="TOTAL TRADES" value={results.trades} />
            <StatCard label="MAX DRAWDOWN" value={results.drawdown} valueColor="var(--color-status-beta)" />
          </div>

          {/* Chart */}
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
            }}
          >
            <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-4)' }}>
              P&amp;L CURVE — {STRATEGIES.find(s => s.id === selectedStrategy)?.label} / {PERIOD_LABELS[selectedPeriod]}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={results.chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={totalReturnPositive ? '#22C55E' : '#EF4444'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={totalReturnPositive ? '#22C55E' : '#EF4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="index"
                  tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v, i, arr) => {
                    if (i === 0) return 'START'
                    if (i === Math.floor((results.chartData.length - 1) / 2)) return 'MID'
                    if (v === results.chartData[results.chartData.length - 1]?.index) return 'END'
                    return ''
                  }}
                />
                <YAxis
                  tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-primary)',
                  }}
                  formatter={v => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'Return']}
                  labelFormatter={i => `Day ${i + 1}`}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={totalReturnPositive ? '#22C55E' : '#EF4444'}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Secondary stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-4)',
            }}
            className="plutus-secondary-grid"
          >
            {[
              { label: 'SHARPE RATIO',     value: results.sharpe },
              { label: 'SORTINO RATIO',    value: results.sortino },
              { label: 'AVG TRADE DUR',    value: results.avgDur },
              { label: 'LARGEST WIN',      value: results.bigWin },
              { label: 'LARGEST LOSS',     value: results.bigLoss },
              { label: 'PROFIT FACTOR',    value: results.profitFactor },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                }}
              >
                <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                  {s.label}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', margin: 0, fontWeight: 'var(--weight-medium)' }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .plutus-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .plutus-secondary-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

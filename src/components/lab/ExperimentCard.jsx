import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function ExperimentCard({ experiment, animationDelay = 0 }) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        animation: `gridAssemble 0.5s var(--ease-out-expo) both`,
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <Card
        hoverable
        accentColor={experiment.accentColor}
        onClick={() => navigate(`/lab/${experiment.slug}`)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          height: '100%',
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            {experiment.classification}
          </span>
          <Badge status={experiment.status} pulse={experiment.status === 'ACTIVE'} />
        </div>

        {/* Experiment name */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-wide)',
            margin: 0,
          }}
        >
          {experiment.shortName}
        </h2>

        {/* Description */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-normal)',
            margin: 0,
            flexGrow: 1,
          }}
        >
          {experiment.description}
        </p>

        {/* Launch link */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: experiment.accentColor,
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-2)',
          }}
        >
          // LAUNCH EXPERIMENT
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Card>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function BuildIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="22" height="22" rx="3" />
      <line x1="9" y1="14" x2="19" y2="14" />
      <line x1="14" y1="9" x2="14" y2="19" />
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h20l-2.5 9H6.5z" />
      <path d="M6.5 13v9h15v-9" />
      <circle cx="11" cy="25" r="1.5" />
      <circle cx="19" cy="25" r="1.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="22" height="20" rx="2" />
      <line x1="3" y1="11" x2="25" y2="11" />
      <line x1="9" y1="3" x2="9" y2="7" />
      <line x1="19" y1="3" x2="19" y2="7" />
    </svg>
  )
}

const CARDS = [
  {
    icon: <BuildIcon />,
    question: 'Need something built from scratch?',
    action: 'HIRE ME',
    type: 'scroll',
    target: 'packages-section',
    accentColor: 'var(--color-accent-primary)',
  },
  {
    icon: <StoreIcon />,
    question: 'Want a starting point you customize?',
    action: 'VIEW STORE',
    type: 'navigate',
    target: '/store',
    accentColor: 'var(--color-accent-secondary)',
  },
  {
    icon: <CalendarIcon />,
    question: 'Just need advice?',
    action: 'BOOK A CALL',
    type: 'navigate',
    target: '/contact',
    accentColor: '#8B5CF6',
  },
]

export default function DecisionTree() {
  const navigate = useNavigate()

  function handleAction(card) {
    if (card.type === 'navigate') {
      navigate(card.target)
    } else if (card.type === 'scroll') {
      document.getElementById(card.target)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        marginBottom: 'var(--space-6)',
      }}>
        // NOT SURE WHAT YOU NEED?
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {CARDS.map((card, i) => (
          <Card
            key={i}
            hoverable
            accentColor={card.accentColor}
            style={{ padding: 'var(--space-6)' }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              alignItems: 'flex-start',
            }}>
              <span style={{ color: card.accentColor, opacity: 0.8 }}>
                {card.icon}
              </span>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-snug)',
                margin: 0,
                flex: 1,
              }}>
                {card.question}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction(card)}
                style={{ borderColor: card.accentColor, color: card.accentColor }}
              >
                {card.action}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

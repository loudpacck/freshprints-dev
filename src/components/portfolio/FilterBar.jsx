import { motion } from 'framer-motion'

const FILTERS = [
  { label: 'ALL', value: 'all' },
  { label: 'SOFTWARE', value: 'software' },
  { label: 'GAMES', value: 'games' },
  { label: 'ENGINEERING', value: 'engineering' },
  { label: 'AI', value: 'ai' },
  { label: 'CONTENT', value: 'content' },
]

export default function FilterBar({ active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-10)',
      }}
    >
      {FILTERS.map(({ label, value }) => {
        const isActive = active === value
        return (
          <motion.button
            key={value}
            onClick={() => onChange(value)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-full)',
              border: isActive
                ? '1px solid var(--color-accent-primary)'
                : '1px solid var(--color-border-subtle)',
              background: isActive
                ? 'var(--color-accent-primary)'
                : 'transparent',
              color: isActive
                ? 'var(--color-text-inverse)'
                : 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--duration-base)',
            }}
          >
            {label}
          </motion.button>
        )
      })}
    </div>
  )
}

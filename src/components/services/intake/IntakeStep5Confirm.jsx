import { motion, AnimatePresence } from 'framer-motion'
import { getCategoryColor } from '@/utils/categoryAssets'

const LABEL_MAP = {
  serviceType: 'Service',
  scope: 'Scope',
  timeline: 'Timeline',
  budget: 'Budget',
  name: 'Name',
  email: 'Email',
  description: 'Description',
}

const SCOPE_LABEL = {
  'new-build': 'New build from scratch',
  'existing-project': 'Existing project',
  'consulting': 'Consulting only',
}

const TIMELINE_LABEL = {
  'asap': 'ASAP (rush)',
  '1-2w': '1–2 weeks',
  '1-2m': '1–2 months',
  '3plus': '3+ months',
  'flexible': 'Flexible',
}

const BUDGET_LABEL = {
  '0-1k': '$0–1K',
  '1-5k': '$1K–5K',
  '5-15k': '$5K–15K',
  '15k+': '$15K+',
}

function resolveValue(key, val) {
  if (!val) return '—'
  if (key === 'scope') return SCOPE_LABEL[val] ?? val
  if (key === 'timeline') return TIMELINE_LABEL[val] ?? val
  if (key === 'budget') return BUDGET_LABEL[val] ?? val
  return val
}

export default function IntakeStep5Confirm({ getValues, submitted }) {
  const values = getValues()
  const accentColor = getCategoryColor(values.serviceType === 'fresh-prints' ? 'engineering' : values.serviceType)

  const fields = ['serviceType', 'scope', 'timeline', 'budget', 'name', 'email', 'description']

  return (
    <div>
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 'var(--space-6)',
              padding: 'var(--space-8) 0',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#22C55E22',
                border: '2px solid #22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              ✓
            </motion.div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-4xl)',
                color: 'var(--color-text-primary)',
                letterSpacing: 'var(--tracking-tight)',
                marginBottom: 'var(--space-3)',
              }}>
                INQUIRY SENT
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
              }}>
                I&apos;ll respond within 48 hours.
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-4xl)',
              color: 'var(--color-text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-2)',
            }}>
              Ready to send?
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-6)',
            }}>
              Review your inquiry before submitting.
            </p>

            <div style={{
              background: 'var(--color-bg-surface)',
              border: `1px solid ${accentColor}44`,
              borderTop: `2px solid ${accentColor}`,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}>
              {fields.map((key, i) => {
                const val = resolveValue(key, values[key])
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      gap: 'var(--space-4)',
                      padding: 'var(--space-3) var(--space-5)',
                      borderBottom: i < fields.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                      alignItems: key === 'description' ? 'flex-start' : 'center',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wide)',
                      minWidth: 90,
                      flexShrink: 0,
                    }}>
                      {LABEL_MAP[key]}
                    </span>
                    <span style={{
                      fontFamily: key === 'description' ? 'var(--font-body)' : 'var(--font-mono)',
                      fontSize: 'var(--text-sm)',
                      color: val === '—' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                      wordBreak: 'break-word',
                      lineHeight: 'var(--leading-snug)',
                    }}>
                      {val}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

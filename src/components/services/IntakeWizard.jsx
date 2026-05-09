import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import Button from '@/components/ui/Button'
import LoadingDot from '@/components/ui/LoadingDot'
import { useSound } from '@/sound/useSound'
import IntakeStep1ServiceType from './intake/IntakeStep1ServiceType'
import IntakeStep2Scope from './intake/IntakeStep2Scope'
import IntakeStep3Timeline from './intake/IntakeStep3Timeline'
import IntakeStep4Description from './intake/IntakeStep4Description'
import IntakeStep5Confirm from './intake/IntakeStep5Confirm'

const TOTAL_STEPS = 5

const STEP_REQUIRED = {
  1: 'serviceType',
  2: 'scope',
  3: ['timeline', 'budget'],
  4: ['name', 'email'],
  5: null,
}

function canAdvance(step, watch) {
  const req = STEP_REQUIRED[step]
  if (!req) return true
  if (Array.isArray(req)) return req.every(k => !!watch(k))
  return !!watch(req)
}

export default function IntakeWizard({ isOpen, onClose, prefillServiceType }) {
  const { play } = useSound()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [direction, setDirection] = useState(1)
  const wasOpenRef = useRef(false)

  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      serviceType: prefillServiceType ?? '',
      scope: '',
      timeline: '',
      budget: '',
      description: '',
      name: '',
      email: '',
    },
  })

  const { register, watch, setValue, getValues, trigger, reset, formState } = form

  useEffect(() => {
    if (prefillServiceType) setValue('serviceType', prefillServiceType)
  }, [prefillServiceType, setValue])

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1)
        setSubmitted(false)
        reset()
      }, 400)
    }
  }, [isOpen, reset])

  // Modal open / close sounds
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) play('modalOpen')
    if (!isOpen && wasOpenRef.current) play('modalClose')
    wasOpenRef.current = isOpen
  }, [isOpen, play])

  const handleClose = useCallback(() => {
    const values = getValues()
    const hasData = Object.entries(values).some(([, v]) => !!v)
    if (hasData && !submitted) {
      if (!window.confirm('Close without sending? Your answers will be lost.')) return
    }
    onClose()
  }, [getValues, submitted, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, handleClose])

  async function advance() {
    if (step === 4) {
      const valid = await trigger(['name', 'email'])
      if (!valid) return
    }
    setDirection(1)
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  function back() {
    setDirection(-1)
    setStep(s => Math.max(s - 1, 1))
  }

  async function submit() {
    setSubmitting(true)
    setSubmitError(false)
    try {
      const values = getValues()
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'intake', ...values }),
      })
      if (!res.ok) throw new Error()
      play('success')
      setSubmitted(true)
      setTimeout(() => { onClose() }, 3200)
    } catch {
      play('error')
      setSubmitError(true)
    } finally {
      setSubmitting(false)
    }
  }

  const canGoNext = canAdvance(step, watch)
  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  const stepProps = { register, watch, setValue, getValues, formState }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--color-bg-overlay)',
              zIndex: 'var(--z-modal)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 'calc(var(--z-modal) + 1)',
              padding: 'var(--space-4)',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              width: '100%',
              maxWidth: 700,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-xl)',
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              overflow: 'hidden',
            }}>
              {/* Progress bar */}
              <div style={{
                padding: 'var(--space-6) var(--space-8) 0',
                flexShrink: 0,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wider)',
                  }}>
                    STEP {step} / {TOTAL_STEPS}
                  </span>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      background: 'none',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-1) var(--space-3)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    ✕ CLOSE
                  </button>
                </div>

                {/* Progress track */}
                <div style={{
                  height: 2,
                  background: 'var(--color-border-subtle)',
                  borderRadius: 1,
                  overflow: 'hidden',
                  marginBottom: 'var(--space-8)',
                }}>
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      height: '100%',
                      background: 'var(--color-accent-primary)',
                      borderRadius: 1,
                    }}
                  />
                </div>
              </div>

              {/* Step content */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 var(--space-8)',
              }}>
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -30 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {step === 1 && <IntakeStep1ServiceType {...stepProps} />}
                    {step === 2 && <IntakeStep2Scope {...stepProps} />}
                    {step === 3 && <IntakeStep3Timeline {...stepProps} />}
                    {step === 4 && <IntakeStep4Description {...stepProps} />}
                    {step === 5 && <IntakeStep5Confirm getValues={getValues} submitted={submitted} />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              {!submitted && (
                <div style={{
                  padding: 'var(--space-6) var(--space-8)',
                  borderTop: '1px solid var(--color-border-subtle)',
                  flexShrink: 0,
                }}>
                  {submitError && (
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-status-error)',
                      textAlign: 'center',
                      marginBottom: 'var(--space-4)',
                    }}>
                      // SEND FAILED — try again or email kyle@freshprints.dev
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={back}
                      disabled={step === 1 || submitting}
                    >
                      ← BACK
                    </Button>

                    {/* Step dots */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <span
                          key={i}
                          style={{
                            width: i + 1 === step ? 16 : 6,
                            height: 6,
                            borderRadius: 3,
                            background: i + 1 <= step ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
                            transition: 'width 200ms, background 200ms',
                          }}
                        />
                      ))}
                    </div>

                    {step < TOTAL_STEPS ? (
                      <Button
                        size="sm"
                        onClick={advance}
                        disabled={!canGoNext}
                      >
                        NEXT →
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={submit}
                        disabled={submitting}
                        icon={submitting ? <LoadingDot size={6} color="var(--color-text-inverse)" /> : null}
                      >
                        {submitting ? 'SENDING' : 'SEND INQUIRY'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

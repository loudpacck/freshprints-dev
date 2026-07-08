import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Button from '@/components/ui/Button'
import LoadingDot from '@/components/ui/LoadingDot'
import { useSound } from '@/sound/useSound'

// Where Blobert stashes a drafted lead message for the contact form to pick up.
const LEAD_DRAFT_KEY = 'blobert_lead_draft'
const LEAD_DRAFT_NOTE = 'Drafted by Blobert — edit anything before sending.'

const TOPICS = [
  'General Question',
  'Press or Media',
  'Podcast / Interview',
  'Partnership',
  'Something Else',
]

const inputStyle = {
  width: '100%',
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--radius-sm)',
  padding: '0.875rem 1rem',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color var(--duration-base), box-shadow var(--duration-base)',
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-5)' }}>
      <label style={{
        display: 'block',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        marginBottom: 'var(--space-2)',
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-status-error)',
          marginTop: 'var(--space-1)',
        }}>
          {error}
        </p>
      )}
    </div>
  )
}

function focusInput(e) {
  e.currentTarget.style.borderColor = 'var(--color-accent-primary)'
  e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-accent-primary-dim)'
}

function blurInput(e) {
  e.currentTarget.style.borderColor = 'var(--color-border-default)'
  e.currentTarget.style.boxShadow = 'none'
}

export default function ContactForm() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [leadNote, setLeadNote] = useState(false)
  const { play } = useSound()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({ mode: 'onChange' })

  // Prefill the message when Blobert drafted a lead. Runs on mount and when
  // Blobert fires the event (covers being drafted while already on /contact).
  // The key is cleared immediately so it never re-applies on a later visit.
  useEffect(() => {
    const apply = () => {
      let draft = null
      try { draft = sessionStorage.getItem(LEAD_DRAFT_KEY) } catch { draft = null }
      if (!draft) return
      setValue('message', draft, { shouldDirty: true, shouldValidate: true })
      setLeadNote(true)
      try { sessionStorage.removeItem(LEAD_DRAFT_KEY) } catch { /* ignore */ }
    }
    apply()
    window.addEventListener('blobert-lead-draft', apply)
    return () => window.removeEventListener('blobert-lead-draft', apply)
  }, [setValue])

  async function onSubmit(data) {
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact', ...data }),
      })
      if (!res.ok) throw new Error()
      play('success')
      setStatus('success')
      reset()
    } catch {
      play('error')
      setStatus('error')
    }
  }

  return (
    <div style={{
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-8)',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-accent)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-widest)',
        marginBottom: 'var(--space-8)',
      }}>
        // SEND A MESSAGE
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="NAME" error={errors.name?.message}>
          <input
            type="text"
            placeholder="Your name"
            style={inputStyle}
            onFocus={focusInput}
            onBlur={blurInput}
            aria-invalid={!!errors.name}
            {...register('name', { required: 'Name is required' })}
          />
        </Field>

        <Field label="EMAIL" error={errors.email?.message}>
          <input
            type="email"
            placeholder="your@email.com"
            style={inputStyle}
            onFocus={focusInput}
            onBlur={blurInput}
            aria-invalid={!!errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
            })}
          />
        </Field>

        <Field label="TOPIC" error={errors.topic?.message}>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={focusInput}
            onBlur={blurInput}
            aria-invalid={!!errors.topic}
            {...register('topic', { required: 'Select a topic' })}
          >
            <option value="">Select a topic...</option>
            {TOPICS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        {leadNote && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)',
            background: 'var(--color-accent-primary-dim, var(--color-bg-elevated))',
            border: '1px solid var(--color-accent-primary)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <span style={{
              flex: 1, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
            }}>
              {LEAD_DRAFT_NOTE}
            </span>
            <button
              type="button"
              onClick={() => setLeadNote(false)}
              aria-label="Dismiss note"
              style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}
            >
              ×
            </button>
          </div>
        )}

        <Field label="MESSAGE" error={errors.message?.message}>
          <textarea
            placeholder="What's on your mind?"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 'var(--leading-normal)' }}
            onFocus={focusInput}
            onBlur={blurInput}
            aria-invalid={!!errors.message}
            {...register('message', {
              required: 'Message is required',
              minLength: { value: 20, message: 'At least 20 characters' },
              maxLength: { value: 2000, message: 'Max 2000 characters' },
            })}
          />
        </Field>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <input
            type="checkbox"
            id="subscribe"
            style={{ accentColor: 'var(--color-accent-primary)', width: 16, height: 16, cursor: 'pointer' }}
            {...register('subscribe')}
          />
          <label htmlFor="subscribe" style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}>
            Subscribe to the dispatch (no spam, just build updates)
          </label>
        </div>

        {status === 'success' && (
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-status-active)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-4)',
          }}>
            // MESSAGE RECEIVED. I'll be in touch.
          </p>
        )}

        {status === 'error' && (
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-status-error)',
            marginBottom: 'var(--space-4)',
          }}>
            // SEND FAILED. Try again or email me directly.
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={status === 'loading' || status === 'success'}
          icon={status === 'loading' ? <LoadingDot size={6} color="var(--color-text-inverse)" /> : null}
        >
          {status === 'loading' ? 'SENDING' : status === 'success' ? 'SENT' : 'SEND MESSAGE'}
        </Button>

        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          marginTop: 'var(--space-4)',
        }}>
          // I respond within 48 hours
        </p>
      </form>
    </div>
  )
}

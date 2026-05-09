import { useState } from 'react'
import Button from '@/components/ui/Button'
import LoadingDot from '@/components/ui/LoadingDot'
import { useSound } from '@/sound/useSound'

export default function NewsletterStrip() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const { play } = useSound()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'newsletter', email }),
      })
      if (!res.ok) throw new Error()
      play('success')
      setStatus('success')
      setTimeout(() => {
        setStatus('idle')
        setEmail('')
      }, 3000)
    } catch {
      play('error')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-12)',
        textAlign: 'center',
        marginTop: 'var(--space-20)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-accent)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-widest)',
          marginBottom: 'var(--space-4)',
        }}
      >
        // DISPATCH
      </p>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-3xl)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--tracking-wide)',
          marginBottom: 'var(--space-3)',
        }}
      >
        GET NOTIFIED
      </h2>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--color-text-secondary)',
          lineHeight: 'var(--leading-normal)',
          maxWidth: 460,
          margin: '0 auto var(--space-8)',
        }}
      >
        Get notified when I ship something new. No spam, no fluff. Just the build log.
      </p>

      {status === 'success' && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-status-active)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            animation: 'fadeIn 0.3s ease both',
          }}
        >
          // SUBSCRIBED. CHECK YOUR INBOX.
        </p>
      )}

      {status === 'error' && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-status-error)',
            animation: 'fadeIn 0.3s ease both',
          }}
        >
          // FAILED. Try again or email me directly.
        </p>
      )}

      {(status === 'idle' || status === 'loading') && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            maxWidth: 440,
            margin: '0 auto',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            aria-label="Email address for dispatch newsletter"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3) var(--space-4)',
              flex: 1,
              minWidth: 220,
              outline: 'none',
              letterSpacing: 'var(--tracking-wide)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent-primary)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)' }}
          />
          <Button
            variant="primary"
            type="submit"
            disabled={status === 'loading'}
            icon={status === 'loading' ? <LoadingDot size={6} color="var(--color-text-inverse)" /> : null}
          >
            {status === 'loading' ? 'SENDING' : 'SUBSCRIBE'}
          </Button>
        </form>
      )}
    </div>
  )
}

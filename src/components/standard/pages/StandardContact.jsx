import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { socialList } from '@/data/socialLinks'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'

// Where Blobert stashes a drafted lead message for the contact form to pick up.
const LEAD_DRAFT_KEY = 'blobert_lead_draft'
const LEAD_DRAFT_NOTE = 'Drafted by Blobert — edit anything before sending.'

const SOCIAL_ICONS = {
  email: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
      <polyline points="2 9 12 15 22 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'youtube-main': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <polygon points="10 8.5 16 12 10 15.5" fill="currentColor"/>
    </svg>
  ),
  'youtube-docs': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <polygon points="10 8.5 16 12 10 15.5" fill="currentColor"/>
    </svg>
  ),
  github: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-3)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 150ms ease',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-2)',
}

function ContactForm() {
  const [status, setStatus] = useState('idle')
  const [leadNote, setLeadNote] = useState(false)
  const { register, handleSubmit, formState: { errors }, setValue } = useForm()

  // Prefill the message when Blobert drafted a lead (mount + event, so it works
  // even when the draft is created while already on /contact). Key cleared after.
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
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div style={{
        padding: 'var(--space-10)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-2xl)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 48, height: 48,
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-5)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-3)',
        }}>
          Message received.
        </h3>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--leading-normal)',
        }}>
          I'll get back to you within 48 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <label style={labelStyle}>Name</label>
        <input
          {...register('name', { required: true })}
          type="text"
          placeholder="Your name"
          style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : 'var(--border-subtle)' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = errors.name ? '#EF4444' : 'var(--border-subtle)'}
        />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input
          {...register('email', { required: true, pattern: /^\S+@\S+\.\S+$/ })}
          type="email"
          placeholder="your@email.com"
          style={{ ...inputStyle, borderColor: errors.email ? '#EF4444' : 'var(--border-subtle)' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = errors.email ? '#EF4444' : 'var(--border-subtle)'}
        />
      </div>
      <div>
        <label style={labelStyle}>Subject</label>
        <select
          {...register('topic', { required: true })}
          style={{
            ...inputStyle,
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236B6B78' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
        >
          <option value="">Select a subject…</option>
          <option value="Project Inquiry">Project Inquiry</option>
          <option value="Collaboration">Collaboration</option>
          <option value="Hiring">Hiring</option>
          <option value="General Question">General Question</option>
          <option value="Other">Other</option>
        </select>
      </div>
      {leadNote && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-md)',
        }}>
          <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {LEAD_DRAFT_NOTE}
          </span>
          <button
            type="button"
            onClick={() => setLeadNote(false)}
            aria-label="Dismiss note"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}
          >
            ×
          </button>
        </div>
      )}
      <div>
        <label style={labelStyle}>Message</label>
        <textarea
          {...register('message', { required: true, minLength: 10 })}
          rows={5}
          placeholder="Tell me about your project or question…"
          style={{
            ...inputStyle,
            resize: 'vertical',
            minHeight: 120,
            borderColor: errors.message ? '#EF4444' : 'var(--border-subtle)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = errors.message ? '#EF4444' : 'var(--border-subtle)'}
        />
      </div>

      {status === 'error' && (
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: '#EF4444',
          padding: 'var(--space-3)',
          background: 'rgba(239, 68, 68, 0.08)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}>
          Something went wrong. Try emailing directly instead.
        </div>
      )}

      <StandardButton
        type="submit"
        disabled={status === 'loading'}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </StandardButton>
    </form>
  )
}

export default function StandardContact() {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero */}
      <section style={{
        paddingTop: 'var(--space-16)',
        paddingBottom: 'var(--space-10)',
        background: 'var(--gradient-hero)',
      }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              marginBottom: 'var(--space-3)',
            }}>
              // CONTACT
            </div>
            <h1 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-6xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
              marginBottom: 'var(--space-4)',
            }}>
              Get in Touch
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: 520,
              lineHeight: 'var(--leading-normal)',
            }}>
              Have a project in mind, or just want to say hi? I read everything.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Two-column */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <div className="sc-two-col">
            {/* Left: reach out */}
            <Reveal>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 'var(--weight-semibold)',
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-6)',
                }}>
                  Reach Out
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {socialList.map(link => (
                    <a
                      key={link.id}
                      href={link.url}
                      target={link.url.startsWith('mailto') ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-4)',
                        padding: 'var(--space-4)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xl)',
                        textDecoration: 'none',
                        transition: 'all 200ms ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--border-accent)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{ color: 'var(--accent)', flexShrink: 0 }}>
                        {SOCIAL_ICONS[link.id] || SOCIAL_ICONS.email}
                      </div>
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-body)',
                          fontWeight: 'var(--weight-medium)',
                          fontSize: 'var(--text-base)',
                          color: 'var(--text-primary)',
                          marginBottom: 2,
                        }}>
                          {link.label}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                        }}>
                          {link.handle}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Right: form */}
            <Reveal delay={0.1}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 'var(--weight-semibold)',
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-6)',
                }}>
                  Send a Message
                </h2>
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <style>{`
        .sc-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-12);
          align-items: start;
        }
        @media (max-width: 900px) {
          .sc-two-col {
            grid-template-columns: 1fr;
            gap: var(--space-10);
          }
        }
      `}</style>
    </motion.div>
  )
}

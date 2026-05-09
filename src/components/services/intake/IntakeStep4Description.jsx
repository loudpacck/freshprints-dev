const inputStyle = {
  width: '100%',
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-3) var(--space-4)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 150ms',
}

export default function IntakeStep4Description({ register, formState: { errors } }) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-4xl)',
        color: 'var(--color-text-primary)',
        letterSpacing: 'var(--tracking-tight)',
        marginBottom: 'var(--space-2)',
      }}>
        Tell me about it
      </h2>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-8)',
      }}>
        The more detail you give, the faster I can respond with a real answer.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Description textarea */}
        <div>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-2)',
          }}>
            // PROJECT DESCRIPTION
          </label>
          <textarea
            {...register('description')}
            placeholder="What are you building? What problem are you solving? Anything else I should know?"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border-default)'}
          />
        </div>

        {/* File upload (UI only) */}
        <div>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-2)',
          }}>
            Attach files (optional)
          </label>
          <div style={{
            border: '1px dashed var(--color-border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            cursor: 'default',
          }}>
            File upload — coming soon
          </div>
        </div>

        {/* Name */}
        <div>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: errors?.name ? 'var(--color-status-error)' : 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-2)',
          }}>
            // YOUR NAME *
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            placeholder="Your name"
            style={{
              ...inputStyle,
              borderColor: errors?.name ? 'var(--color-status-error)' : undefined,
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent-primary)'}
            onBlur={e => e.target.style.borderColor = errors?.name ? 'var(--color-status-error)' : 'var(--color-border-default)'}
          />
          {errors?.name && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-status-error)' }}>
              {errors.name.message}
            </span>
          )}
        </div>

        {/* Email */}
        <div>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: errors?.email ? 'var(--color-status-error)' : 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-2)',
          }}>
            // EMAIL ADDRESS *
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
            })}
            type="email"
            placeholder="you@example.com"
            style={{
              ...inputStyle,
              borderColor: errors?.email ? 'var(--color-status-error)' : undefined,
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent-primary)'}
            onBlur={e => e.target.style.borderColor = errors?.email ? 'var(--color-status-error)' : 'var(--color-border-default)'}
          />
          {errors?.email && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-status-error)' }}>
              {errors.email.message}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

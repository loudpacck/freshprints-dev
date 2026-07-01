import { useEffect, useState } from 'react'

const FIELDS = [
  { key: 'gamePageViews', label: 'Game Page Views' },
  { key: 'questsCompleted', label: 'Quests Completed' },
  { key: 'pvpFights', label: 'PvP Fights' },
  { key: 'drachmaEconomy', label: 'Drachma Economy' },
  { key: 'activePlayers', label: 'Active Players' },
]

function formatTimestamp(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const inputStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-base)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-3) var(--space-4)',
  outline: 'none',
  width: '100%',
}

export default function HirePageStats() {
  const [values, setValues]         = useState(null) // { gamePageViews: '11458', ... } as strings for the inputs
  const [updatedAt, setUpdatedAt]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState('')
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/admin/overview?action=get_hire_stats')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (d.error) throw new Error(d.error)
        const next = {}
        for (const f of FIELDS) next[f.key] = String(d.stats[f.key] ?? '')
        setValues(next)
        setUpdatedAt(d.stats.updatedAt)
        setLoadError('')
      })
      .catch(err => { if (!cancelled) setLoadError(err.message || 'Failed to load hire stats') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  function handleChange(key, raw) {
    setValues(v => ({ ...v, [key]: raw }))
    setSaved(false)
  }

  function validate() {
    for (const f of FIELDS) {
      const raw = values[f.key]
      if (raw === '' || raw === null || raw === undefined) return `${f.label} cannot be empty.`
      const n = Number(raw)
      if (!Number.isInteger(n) || n < 0) return `${f.label} must be a non-negative whole number.`
    }
    return ''
  }

  async function handleSave() {
    const err = validate()
    if (err) {
      setSaveError(err)
      setSaved(false)
      return
    }
    setSaveError('')
    setSaving(true)
    setSaved(false)
    try {
      const body = {}
      for (const f of FIELDS) body[f.key] = Number(values[f.key])
      const r = await fetch('/api/admin/overview?action=save_hire_stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok || d.error) throw new Error(d.error || 'Save failed')
      const next = {}
      for (const f of FIELDS) next[f.key] = String(d.stats[f.key] ?? '')
      setValues(next)
      setUpdatedAt(d.stats.updatedAt)
      setSaved(true)
    } catch (e) {
      setSaveError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
        marginBottom: 'var(--space-6)',
      }}>
        // HIRE STATS
      </p>

      <div style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        maxWidth: 480,
      }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          lineHeight: 'var(--leading-normal)',
          marginTop: 0,
          marginBottom: 'var(--space-6)',
        }}>
          Editable numbers shown on the Pantheon Wars card at /hire. Saving here updates the live page — no code changes or deploy needed.
        </p>

        {loading ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>LOADING...</p>
        ) : loadError ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgb(239,68,68)' }}>// ERROR: {loadError}</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              {FIELDS.map(f => (
                <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    letterSpacing: 'var(--tracking-wider)',
                    textTransform: 'uppercase',
                  }}>
                    {f.label}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={values[f.key]}
                    onChange={e => handleChange(f.key, e.target.value)}
                    style={inputStyle}
                  />
                </label>
              ))}
            </div>

            {saveError && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgb(239,68,68)', marginBottom: 'var(--space-4)' }}>
                // {saveError}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: 'var(--tracking-wider)',
                  textTransform: 'uppercase',
                  padding: 'var(--space-3) var(--space-6)',
                  background: 'rgba(0,200,255,0.08)',
                  border: '1px solid rgba(0,200,255,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-accent-primary)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'SAVING...' : 'SAVE'}
              </button>

              {saved && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#22C55E', letterSpacing: 'var(--tracking-wider)' }}>
                  Saved ✓
                </span>
              )}
            </div>

            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              letterSpacing: 'var(--tracking-wider)',
              marginTop: 'var(--space-4)',
              marginBottom: 0,
            }}>
              Last updated: {formatTimestamp(updatedAt)}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

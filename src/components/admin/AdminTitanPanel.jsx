import { useState } from 'react'

const TITANS = [
  { id: 1, name: 'Kronos, Devourer of Time' },
  { id: 2, name: 'Tiamat, Mother of Chaos' },
  { id: 3, name: 'Ymir, the Frost Primordial' },
  { id: 4, name: 'Atlas, the Sky-Bearer' },
  { id: 5, name: 'Nergal, Lord of the Dead' },
  { id: 6, name: 'Surtr, the Black Flame' },
  { id: 7, name: 'Hecate, Mistress of Magic' },
  { id: 8, name: 'Enlil, the Storm Sovereign' },
]

const field = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  background: 'var(--color-bg-base)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 4,
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
}

export default function AdminTitanPanel() {
  const [selectedTitanId, setSelectedTitanId] = useState('')
  const [queueMinutes, setQueueMinutes] = useState(60)
  const [triggering, setTriggering] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleTrigger() {
    setTriggering(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=titan_admin_trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titan_id: selectedTitanId ? Number(selectedTitanId) : undefined,
          queue_duration_minutes: queueMinutes,
        }),
      })
      const data = await res.json()
      if (res.ok) setResult(data)
      else setError(data.message || data.error)
    } catch (e) {
      setError('Request failed')
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div style={{ fontFamily: 'var(--font-mono)' }}>
      <p style={{
        fontSize: 10,
        color: 'var(--color-accent-primary)',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        marginBottom: 20,
      }}>
        // TITAN EVENT TRIGGER
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <div>
          <label style={{ display: 'block', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            TITAN (leave blank for random)
          </label>
          <select
            value={selectedTitanId}
            onChange={e => setSelectedTitanId(e.target.value)}
            style={field}
          >
            <option value="">(Random)</option>
            {TITANS.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            QUEUE DURATION (MINUTES)
          </label>
          <input
            type="number"
            value={queueMinutes}
            onChange={e => setQueueMinutes(Math.max(1, parseInt(e.target.value, 10) || 60))}
            min={1}
            max={1440}
            style={field}
          />
        </div>

        <button
          onClick={handleTrigger}
          disabled={triggering}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 20px',
            background: 'var(--color-accent-primary)',
            color: 'var(--color-bg-base)',
            border: 'none',
            borderRadius: 4,
            cursor: triggering ? 'wait' : 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            opacity: triggering ? 0.6 : 1,
          }}
        >
          {triggering ? 'TRIGGERING...' : 'TRIGGER EVENT'}
        </button>

        {result && (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(0,200,80,0.08)',
            border: '1px solid rgba(0,200,80,0.28)',
            borderRadius: 4,
            fontSize: 11,
            lineHeight: 1.6,
            color: 'var(--color-text-primary)',
          }}>
            <div style={{ color: '#22C55E', marginBottom: 4 }}>// EVENT CREATED</div>
            <div>Titan ID: {result.titan_id}</div>
            <div>Queue opens: {new Date(result.queue_opens_at).toLocaleString()}</div>
            <div>Fight starts: {new Date(result.fight_starts_at).toLocaleString()}</div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.28)',
            borderRadius: 4,
            fontSize: 11,
            color: '#F87171',
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

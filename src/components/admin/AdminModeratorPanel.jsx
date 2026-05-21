import { useEffect, useState } from 'react'

// ── Shared field style ─────────────────────────────────────────────────────────
const field = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  background: 'var(--color-bg-base)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  outline: 'none',
  boxSizing: 'border-box',
}

const sectionHead = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-accent-primary)',
  marginBottom: 'var(--space-4)',
}

const tableHead = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  padding: '6px 10px',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-border-subtle)',
  whiteSpace: 'nowrap',
}

const tableCell = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-secondary)',
  padding: '8px 10px',
  borderBottom: '1px solid var(--color-border-subtle)',
  verticalAlign: 'middle',
}

function btnSmall(variant = 'default') {
  return {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
    letterSpacing: 'var(--tracking-wider)',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    border: variant === 'danger'
      ? '1px solid rgba(239,68,68,0.4)'
      : '1px solid var(--color-border-subtle)',
    background: 'none',
    color: variant === 'danger'
      ? 'rgb(239,68,68)'
      : 'var(--color-text-muted)',
    transition: 'color 150ms, border-color 150ms',
  }
}

// ── Token Reveal Banner ────────────────────────────────────────────────────────
function TokenReveal({ token, expiresAt, onDismiss }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: 'rgba(0,200,255,0.06)',
      border: '1px solid rgba(0,200,255,0.25)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-5)',
      marginBottom: 'var(--space-5)',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-accent-primary)',
        letterSpacing: 'var(--tracking-wider)',
        marginBottom: 'var(--space-2)',
      }}>
        // INVITE GENERATED — COPY NOW, IT WON&apos;T BE SHOWN AGAIN
      </p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-2)',
      }}>
        <code style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-primary)',
          background: 'var(--color-bg-base)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 12px',
          letterSpacing: '0.05em',
          flex: 1,
          wordBreak: 'break-all',
        }}>
          {token}
        </code>
        <button onClick={copy} style={btnSmall()}>
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-3)',
      }}>
        Expires: {new Date(expiresAt).toLocaleString()} (7 days)
      </p>
      <button onClick={onDismiss} style={btnSmall()}>DONE</button>
    </div>
  )
}

// ── Section 1: Invite Tokens ───────────────────────────────────────────────────
function InviteSection({ generatedToken, onGenerate }) {
  const [label, setLabel]     = useState('')
  const [busy, setBusy]       = useState(false)
  const [invites, setInvites] = useState([])
  const [loadErr, setLoadErr] = useState('')

  async function loadInvites() {
    try {
      const r = await fetch('/api/auth/moderator?action=list_invites')
      const d = await r.json()
      if (r.ok) setInvites(d.invites || [])
      else setLoadErr(d.error || 'Failed to load invites.')
    } catch {
      setLoadErr('Network error.')
    }
  }

  useEffect(() => { loadInvites() }, [])

  async function generate() {
    setBusy(true)
    try {
      const r = await fetch('/api/auth/moderator?action=generate_invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || undefined }),
      })
      const d = await r.json()
      if (r.ok) {
        setLabel('')
        onGenerate(d)
        loadInvites()
      }
    } catch { /* ignore */ }
    setBusy(false)
  }

  const activeInvites = invites.filter(i => !i.used && new Date(i.expires_at) > new Date())

  return (
    <section style={{ marginBottom: 'var(--space-10)' }}>
      <p style={sectionHead}>// INVITE TOKENS</p>

      {generatedToken && (
        <TokenReveal
          token={generatedToken.token}
          expiresAt={generatedToken.expires_at}
          onDismiss={() => onGenerate(null)}
        />
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <input
          style={{ ...field, flex: 1, minWidth: 180 }}
          placeholder="Label (optional — e.g. for Discord mod John)"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <button
          onClick={generate}
          disabled={busy}
          style={{
            ...btnSmall(),
            padding: '8px 16px',
            color: 'var(--color-accent-primary)',
            borderColor: 'rgba(0,200,255,0.3)',
          }}
        >
          {busy ? 'GENERATING...' : 'GENERATE INVITE'}
        </button>
      </div>

      {loadErr && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgb(239,68,68)', marginBottom: 'var(--space-3)' }}>
          {loadErr}
        </p>
      )}

      {activeInvites.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          No active invites.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Label', 'Created', 'Expires'].map(h => (
                  <th key={h} style={tableHead}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeInvites.map(inv => (
                <tr key={inv.id}>
                  <td style={tableCell}>{inv.label || '—'}</td>
                  <td style={tableCell}>{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td style={tableCell}>{new Date(inv.expires_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ── Section 2: Active Moderators ───────────────────────────────────────────────
function ModeratorListSection() {
  const [mods, setMods]   = useState([])
  const [err, setErr]     = useState('')
  const [busy, setBusy]   = useState(null) // moderator_id being deactivated

  async function loadMods() {
    try {
      const r = await fetch('/api/auth/moderator?action=list_mods')
      const d = await r.json()
      if (r.ok) setMods(d.moderators || [])
      else setErr(d.error || 'Failed to load moderators.')
    } catch {
      setErr('Network error.')
    }
  }

  useEffect(() => { loadMods() }, [])

  async function deactivate(modId) {
    if (!window.confirm('Deactivate this moderator? They will lose all active sessions.')) return
    setBusy(modId)
    try {
      const r = await fetch('/api/auth/moderator?action=deactivate_mod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderator_id: modId }),
      })
      if (r.ok) loadMods()
    } catch { /* ignore */ }
    setBusy(null)
  }

  return (
    <section style={{ marginBottom: 'var(--space-10)' }}>
      <p style={sectionHead}>// ACTIVE MODERATORS</p>
      {err && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgb(239,68,68)', marginBottom: 'var(--space-3)' }}>
          {err}
        </p>
      )}
      {mods.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          No moderators yet.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Username', 'Created', 'Last Login', 'Status', ''].map(h => (
                  <th key={h} style={tableHead}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mods.map(mod => (
                <tr key={mod.id}>
                  <td style={{ ...tableCell, color: 'var(--color-text-primary)' }}>{mod.username}</td>
                  <td style={tableCell}>{new Date(mod.created_at).toLocaleDateString()}</td>
                  <td style={tableCell}>{mod.last_login ? new Date(mod.last_login).toLocaleDateString() : '—'}</td>
                  <td style={tableCell}>
                    <span style={{
                      color: mod.is_active ? '#22C55E' : 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                    }}>
                      {mod.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={tableCell}>
                    {mod.is_active && (
                      <button
                        onClick={() => deactivate(mod.id)}
                        disabled={busy === mod.id}
                        style={btnSmall('danger')}
                      >
                        {busy === mod.id ? '...' : 'DEACTIVATE'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ── Section 3: Action Log ──────────────────────────────────────────────────────
function ActionLogSection() {
  const [actions, setActions] = useState([])
  const [err, setErr]         = useState('')

  useEffect(() => {
    fetch('/api/auth/moderator?action=list_actions')
      .then(r => r.json())
      .then(d => {
        if (d.actions) setActions(d.actions)
        else setErr(d.error || 'Failed to load action log.')
      })
      .catch(() => setErr('Network error.'))
  }, [])

  function summarize(action) {
    const d = action.action_data || {}
    if (action.action_type === 'account_lookup') return `"${d.query || ''}" → ${d.results_count ?? 0} result(s)`
    if (action.action_type === 'login') return `IP: ${d.ip || 'unknown'}`
    if (action.action_type === 'activate') return 'Account activated'
    return JSON.stringify(d).slice(0, 60)
  }

  return (
    <section>
      <p style={sectionHead}>// MODERATOR ACTION LOG</p>
      {err && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgb(239,68,68)', marginBottom: 'var(--space-3)' }}>
          {err}
        </p>
      )}
      {actions.length === 0 && !err ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          No actions logged yet.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Moderator', 'Action', 'Detail', 'When'].map(h => (
                  <th key={h} style={tableHead}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map(a => (
                <tr key={a.id}>
                  <td style={{ ...tableCell, color: 'var(--color-text-primary)' }}>{a.moderator_username || '—'}</td>
                  <td style={{ ...tableCell, color: 'var(--color-accent-primary)' }}>{a.action_type}</td>
                  <td style={{ ...tableCell, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summarize(a)}</td>
                  <td style={{ ...tableCell, whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ── Section 4: Active Chat Moderations ────────────────────────────────────────
function ChatModerationSection() {
  const [mods, setMods]       = useState([])
  const [err, setErr]         = useState('')
  const [lifting, setLifting] = useState(null)

  async function load() {
    try {
      const r = await fetch('/api/auth/moderator?action=chat_moderations')
      const d = await r.json()
      if (d.ok) setMods(d.moderations || [])
      else setErr(d.error || 'Failed to load.')
    } catch { setErr('Network error.') }
  }

  useEffect(() => { load() }, [])

  async function lift(id) {
    setLifting(id)
    try {
      const r = await fetch('/api/auth/moderator?action=chat_lift_moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderation_id: id }),
      })
      const d = await r.json()
      if (d.ok) load()
    } catch { /* ignore */ }
    setLifting(null)
  }

  function remaining(m) {
    if (!m.expires_at) return '∞'
    const ms = new Date(m.expires_at) - Date.now()
    if (ms <= 0) return 'expired'
    const mins = Math.floor(ms / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <section style={{ marginBottom: 'var(--space-10)' }}>
      <p style={sectionHead}>// ACTIVE CHAT MODERATIONS</p>
      {err && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgb(239,68,68)', marginBottom: 'var(--space-3)' }}>
          {err}
        </p>
      )}
      {mods.length === 0 && !err ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          No active moderations.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Target', 'Action', 'Remaining', 'Reason', 'By', 'When', ''].map(h => (
                  <th key={h} style={tableHead}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mods.map(m => (
                <tr key={m.id}>
                  <td style={{ ...tableCell, color: 'var(--color-text-primary)' }}>{m.target_username}</td>
                  <td style={{ ...tableCell, color: 'var(--color-accent-primary)', textTransform: 'uppercase' }}>{m.action}</td>
                  <td style={tableCell}>{remaining(m)}</td>
                  <td style={{ ...tableCell, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.reason || '—'}
                  </td>
                  <td style={tableCell}>{m.mod_username || '—'}</td>
                  <td style={{ ...tableCell, whiteSpace: 'nowrap' }}>{new Date(m.created_at).toLocaleString()}</td>
                  <td style={tableCell}>
                    <button
                      onClick={() => lift(m.id)}
                      disabled={lifting === m.id}
                      style={btnSmall('danger')}
                    >
                      {lifting === m.id ? '...' : 'LIFT'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ── Section 5: Chat Moderation Audit Log ──────────────────────────────────────
function ChatAuditLogSection() {
  const [actions, setActions] = useState([])
  const [err, setErr]         = useState('')

  useEffect(() => {
    fetch('/api/auth/moderator?action=chat_audit')
      .then(r => r.json())
      .then(d => {
        if (d.ok) setActions(d.actions || [])
        else setErr(d.error || 'Failed to load.')
      })
      .catch(() => setErr('Network error.'))
  }, [])

  function statusBadge(a) {
    if (a.lifted_at) {
      const by = a.lifted_by_username ? ` by ${a.lifted_by_username}` : ''
      return <span style={{ color: '#22C55E', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>LIFTED{by}</span>
    }
    if (a.expires_at && new Date(a.expires_at) < new Date()) {
      return <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>EXPIRED</span>
    }
    if (a.action === 'delete_msg' || a.action === 'kick') {
      return <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>DONE</span>
    }
    return <span style={{ color: 'rgb(239,68,68)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>ACTIVE</span>
  }

  return (
    <section style={{ marginBottom: 'var(--space-10)' }}>
      <p style={sectionHead}>// CHAT MODERATION AUDIT LOG</p>
      {err && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgb(239,68,68)', marginBottom: 'var(--space-3)' }}>
          {err}
        </p>
      )}
      {actions.length === 0 && !err ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          No chat moderation actions yet.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Target', 'Action', 'Moderator', 'Reason', 'Applied', 'Status'].map(h => (
                  <th key={h} style={tableHead}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map(a => (
                <tr key={a.id}>
                  <td style={{ ...tableCell, color: 'var(--color-text-primary)' }}>{a.target_username}</td>
                  <td style={{ ...tableCell, color: 'var(--color-accent-primary)', textTransform: 'uppercase' }}>{a.action}</td>
                  <td style={tableCell}>{a.mod_username || '—'}</td>
                  <td style={{ ...tableCell, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.reason || '—'}
                  </td>
                  <td style={{ ...tableCell, whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleString()}</td>
                  <td style={tableCell}>{statusBadge(a)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ── Section 6: Mod Badge Settings ─────────────────────────────────────────────
function ModBadgeSettingsSection() {
  const [mods, setMods]         = useState([])
  const [err, setErr]           = useState('')
  const [toggling, setToggling] = useState(null)

  async function loadMods() {
    try {
      const r = await fetch('/api/auth/moderator?action=list_mods')
      const d = await r.json()
      if (r.ok) setMods((d.moderators || []).filter(m => m.is_active))
      else setErr(d.error || 'Failed to load.')
    } catch { setErr('Network error.') }
  }

  useEffect(() => { loadMods() }, [])

  async function toggleBadge(mod) {
    setToggling(mod.id)
    try {
      const r = await fetch('/api/auth/moderator?action=set_mod_badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderator_id: mod.id, show_badge: !mod.show_chat_badge }),
      })
      const d = await r.json()
      if (d.ok) loadMods()
    } catch { /* ignore */ }
    setToggling(null)
  }

  return (
    <section style={{ marginBottom: 'var(--space-10)' }}>
      <p style={sectionHead}>// MOD BADGE SETTINGS</p>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-4)',
      }}>
        Control whether each moderator displays a gold MOD badge on their public chat messages.
      </p>
      {err && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgb(239,68,68)', marginBottom: 'var(--space-3)' }}>
          {err}
        </p>
      )}
      {mods.length === 0 && !err ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          No active moderators.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {mods.map(mod => (
            <div key={mod.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>
                {mod.username}
              </span>
              <button
                onClick={() => toggleBadge(mod)}
                disabled={toggling === mod.id}
                style={{
                  ...btnSmall(),
                  color: mod.show_chat_badge ? 'rgba(255,215,0,0.9)' : 'var(--color-text-muted)',
                  borderColor: mod.show_chat_badge ? 'rgba(255,215,0,0.35)' : 'var(--color-border-subtle)',
                }}
              >
                {toggling === mod.id ? '...' : mod.show_chat_badge ? 'BADGE ON' : 'BADGE OFF'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function AdminModeratorPanel() {
  const [generatedToken, setGeneratedToken] = useState(null)

  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
        marginBottom: 'var(--space-8)',
      }}>
        // MODERATOR MANAGEMENT
      </p>

      <InviteSection
        generatedToken={generatedToken}
        onGenerate={data => setGeneratedToken(data)}
      />
      <ModeratorListSection />
      <ModBadgeSettingsSection />
      <ChatModerationSection />
      <ChatAuditLogSection />
      <ActionLogSection />
    </div>
  )
}

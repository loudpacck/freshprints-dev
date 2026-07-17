import { useEffect, useState, useCallback, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminOverview from '@/components/admin/AdminOverview'
import AdminTitanPanel from '@/components/admin/AdminTitanPanel'
import AdminModeratorPanel from '@/components/admin/AdminModeratorPanel'
import SiteAnalytics from '@/components/admin/SiteAnalytics'
import GameMetrics from '@/components/admin/GameMetrics'
import TownshipLayoutEditor from '@/components/admin/TownshipLayoutEditor'
import HirePageStats from '@/components/admin/HirePageStats'
import BlobertAdmin from '@/components/admin/BlobertAdmin'

// ── Moderator-only: account lookup ─────────────────────────────────────────────

function ModAccountLookup() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim() || query.trim().length < 2) {
      setError('Enter at least 2 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const r = await fetch(`/api/auth/moderator?action=lookup_player&q=${encodeURIComponent(query.trim())}`)
      const d = await r.json()
      if (r.ok) setResults(d.players || [])
      else setError(d.error || 'Lookup failed.')
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  const tdStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
    padding: '8px 10px',
    borderBottom: '1px solid var(--color-border-subtle)',
    verticalAlign: 'middle',
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
        // ACCOUNT LOOKUP
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search username or email..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          style={{
            flex: 1,
            minWidth: 200,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-primary)',
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-3) var(--space-4)',
            outline: 'none',
            letterSpacing: 'var(--tracking-wider)',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
            padding: 'var(--space-3) var(--space-5)',
            background: 'rgba(0,200,255,0.08)',
            border: '1px solid rgba(0,200,255,0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-accent-primary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '...' : 'SEARCH'}
        </button>
      </form>

      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgb(239,68,68)', marginBottom: 'var(--space-4)' }}>
          // {error}
        </p>
      )}

      {results !== null && (
        results.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            No players found for &quot;{query}&quot;.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Username', 'Email', 'Faction', 'Class', 'Level', 'Created'].map(h => (
                    <th key={h} style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: 'var(--tracking-wider)',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-muted)',
                      padding: '6px 10px',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map(p => (
                  <tr key={p.id}>
                    <td style={{ ...tdStyle, color: 'var(--color-text-primary)' }}>{p.username}</td>
                    <td style={tdStyle}>{p.email}</td>
                    <td style={tdStyle}>{p.faction}</td>
                    <td style={tdStyle}>{p.class}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-accent-primary)' }}>{p.level ?? '—'}</td>
                    <td style={tdStyle}>{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

// ── Moderator dashboard ────────────────────────────────────────────────────────

function ModDashboard({ modUsername, onLogout }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-8)',
        borderBottom: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-elevated)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}>
        <div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: '#C9A961',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
            marginRight: 'var(--space-3)',
          }}>
            //
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--tracking-wide)',
          }}>
            PANTHEON WARS — MODERATOR
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: '#C9A961',
            letterSpacing: 'var(--tracking-wider)',
            marginLeft: 'var(--space-3)',
          }}>
            {modUsername}
          </span>
        </div>
        <button
          onClick={onLogout}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            background: 'none',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-2) var(--space-4)',
            cursor: 'pointer',
            transition: 'color var(--duration-base), border-color var(--duration-base)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--color-text-primary)'
            e.currentTarget.style.borderColor = 'var(--color-border-default)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--color-text-muted)'
            e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
          }}
        >
          LOGOUT
        </button>
      </header>

      <main style={{ flex: 1, padding: 'var(--space-8)', overflowY: 'auto', maxWidth: 900 }}>
        <ModAccountLookup />
      </main>
    </motion.div>
  )
}

// ── Admin nav items ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview',   label: 'OVERVIEW' },
  { id: 'analytics',  label: 'SITE ANALYTICS' },
  { id: 'game',       label: 'GAME METRICS' },
  { id: 'blobert',    label: 'BLOBERT' },
  { id: 'hireStats',  label: 'HIRE STATS' },
  { id: 'titan',      label: 'TITAN' },
  { id: 'moderator',  label: 'MODERATOR' },
  { id: 'township',   label: 'TOWNSHIP EDITOR', icon: '🏘' },
]

function formatAgo(date) {
  if (!date) return '—'
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  return `${Math.floor(secs / 60)}m ago`
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Admin() {
  const navigate = useNavigate()
  const [checking, setChecking]           = useState(true)
  const [authType, setAuthType]           = useState(null) // 'admin' | 'mod'
  const [modUsername, setModUsername]     = useState('')
  const [activeSection, setActiveSection] = useState('overview')
  const [refreshKey, setRefreshKey]       = useState(0)
  const [lastUpdated, setLastUpdated]     = useState(null)
  const [, rerender]                      = useReducer(x => x + 1, 0)

  // Tick every 10s to keep "Xs ago" current
  useEffect(() => {
    const id = setInterval(rerender, 10000)
    return () => clearInterval(id)
  }, [])

  const handleLastUpdated = useCallback(ts => setLastUpdated(ts), [])

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/admin?action=check').then(r => r.json()).catch(() => ({ authenticated: false })),
      fetch('/api/auth/moderator?action=check').then(r => r.json()).catch(() => ({ authenticated: false })),
    ]).then(([adminData, modData]) => {
      if (adminData.authenticated) {
        setAuthType('admin')
        setChecking(false)
      } else if (modData.authenticated) {
        setAuthType('mod')
        setModUsername(modData.username || '')
        setChecking(false)
      } else {
        navigate('/', { replace: true })
      }
    })
  }, [navigate])

  async function handleLogout() {
    if (authType === 'admin') {
      await fetch('/api/auth/admin?action=logout', { method: 'POST' })
    } else {
      await fetch('/api/auth/moderator?action=logout', { method: 'POST' })
    }
    navigate('/')
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-base)',
      }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          letterSpacing: 'var(--tracking-wider)',
        }}>
          // VERIFYING SESSION...
        </p>
      </div>
    )
  }

  // Moderator view — no sidebar, account lookup only
  if (authType === 'mod') {
    return <ModDashboard modUsername={modUsername} onLogout={handleLogout} />
  }

  // Admin view — full dashboard
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-8)',
        borderBottom: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-elevated)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
      }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-accent-primary)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginRight: 'var(--space-3)' }}>
            //
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-wide)' }}>
            ADMIN
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', marginLeft: 'var(--space-3)' }}>
            freshprints.dev
          </span>
        </div>

        {/* Refresh controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginLeft: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', whiteSpace: 'nowrap' }}>
            SYNC: {formatAgo(lastUpdated)}
          </span>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            title="Refresh all data"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-wider)',
              textTransform: 'uppercase',
              color: 'var(--color-accent-primary)',
              background: 'rgba(0,200,255,0.06)',
              border: '1px solid rgba(0,200,255,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-2) var(--space-3)',
              cursor: 'pointer',
              transition: 'background 150ms, border-color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,200,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(0,200,255,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,200,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,200,255,0.2)' }}
          >
            ↻ REFRESH
          </button>
          <button
            onClick={handleLogout}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              letterSpacing: 'var(--tracking-wider)',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              background: 'none',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-2) var(--space-4)',
              cursor: 'pointer',
              transition: 'color var(--duration-base), border-color var(--duration-base)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.borderColor = 'var(--color-border-default)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border-subtle)' }}
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1 }} className="admin-body">
        {/* Sidebar */}
        <aside style={{
          width: 200,
          borderRight: '1px solid var(--color-border-subtle)',
          padding: 'var(--space-6) var(--space-4)',
          flexShrink: 0,
        }} className="admin-sidebar">
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: 'var(--tracking-wider)',
                  textTransform: 'uppercase',
                  padding: 'var(--space-2) var(--space-3)',
                  background: activeSection === item.id ? 'rgba(0,200,255,0.08)' : 'none',
                  borderLeft: activeSection === item.id ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  color: activeSection === item.id ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'color 150ms, background 150ms',
                }}
              >
                {item.icon ? `${item.icon} ${item.label}` : item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: 'var(--space-8)', overflowY: 'auto', minWidth: 0 }}>
          {activeSection === 'overview' && (
            <>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-6)' }}>
                // OVERVIEW
              </p>
              <AdminOverview refreshKey={refreshKey} onLastUpdated={handleLastUpdated} />
            </>
          )}
          {activeSection === 'analytics' && (
            <>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-6)' }}>
                // SITE ANALYTICS
              </p>
              <SiteAnalytics refreshKey={refreshKey} onLastUpdated={handleLastUpdated} />
            </>
          )}
          {activeSection === 'game' && (
            <>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-6)' }}>
                // GAME METRICS
              </p>
              <GameMetrics refreshKey={refreshKey} onLastUpdated={handleLastUpdated} />
            </>
          )}
          {activeSection === 'blobert' && <BlobertAdmin refreshKey={refreshKey} onLastUpdated={handleLastUpdated} />}
          {activeSection === 'hireStats' && <HirePageStats />}
          {activeSection === 'titan' && <AdminTitanPanel />}
          {activeSection === 'moderator' && <AdminModeratorPanel />}
          {activeSection === 'township' && <TownshipLayoutEditor />}
        </main>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .admin-body { flex-direction: column; }
          .admin-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--color-border-subtle); padding: var(--space-3) var(--space-4) !important; }
        }
      `}</style>
    </motion.div>
  )
}

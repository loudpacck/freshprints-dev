import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminOverview from '@/components/admin/AdminOverview'
import AdminTitanPanel from '@/components/admin/AdminTitanPanel'

const NAV_ITEMS = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'titan',    label: 'TITAN' },
]

export default function Admin() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) navigate('/', { replace: true })
        else setChecking(false)
      })
      .catch(() => navigate('/', { replace: true }))
  }, [navigate])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
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
      }}>
        <div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-accent-primary)',
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
            ADMIN
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            letterSpacing: 'var(--tracking-wider)',
            marginLeft: 'var(--space-3)',
          }}>
            freshprints.dev
          </span>
        </div>
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
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{
          flex: 1,
          padding: 'var(--space-8)',
          overflowY: 'auto',
          minWidth: 0,
        }}>
          {activeSection === 'overview' && (
            <>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                marginBottom: 'var(--space-6)',
              }}>
                // OVERVIEW
              </p>
              <AdminOverview />
            </>
          )}
          {activeSection === 'titan' && <AdminTitanPanel />}
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

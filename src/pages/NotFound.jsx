import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'

export default function NotFound() {
  const { pathname } = useLocation()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-text-primary)',
          letterSpacing: 'var(--tracking-wide)',
          marginBottom: 'var(--space-4)',
        }}>
          {'> ROUTE NOT FOUND'}
        </p>

        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-8)',
          wordBreak: 'break-all',
        }}>
          {'> ERROR 404 // requested path: '}{pathname}
        </p>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-1)',
        }}>
          <span>{'> '}</span>
          <span style={{ animation: 'cursorBlink 1.2s step-end infinite' }}>▊</span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/hub" style={{ textDecoration: 'none' }}>
            <Button variant="primary">RETURN TO HUB</Button>
          </Link>
          <Link to="/portfolio" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">VIEW PORTFOLIO</Button>
          </Link>
        </div>

        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          marginTop: 'var(--space-8)',
        }}>
          // press ` to open terminal
        </p>
      </div>
    </motion.div>
  )
}

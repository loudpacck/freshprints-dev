import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

export default function Profile() {
  const { user, stats } = usePantheonWars()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: '#07070D',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.09) 0%, transparent 55%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
        color: '#F0F0F8',
      }}
    >
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 20px',
        background: 'rgba(7,7,13,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚔</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '0.1em' }}>
            PANTHEON WARS
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(240,240,248,0.3)',
            marginLeft: 4,
          }}>
            / PROFILE
          </span>
        </div>
        <Link
          to="/games/pantheon-wars"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(240,240,248,0.38)',
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '6px 12px',
          }}
        >
          ← Command Center
        </Link>
      </header>

      <main style={{ flex: 1, maxWidth: 640, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(240,240,248,0.3)',
          marginBottom: 16,
        }}>
          // COMING SOON
        </p>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(40px, 12vw, 72px)',
          letterSpacing: '0.07em',
          color: '#F0F0F8',
          margin: '0 0 24px',
          lineHeight: 1,
        }}>
          PROFILE
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: 'rgba(240,240,248,0.45)',
          lineHeight: 1.6,
          maxWidth: 440,
          margin: '0 auto',
          marginBottom: 32,
        }}>
          Spend stat points earned from leveling up. Allocate attack, defense, energy max, or health max. Your build choices are permanent — spend wisely based on your class.
        </p>
        {stats && stats.stat_points > 0 && (
          <div style={{
            display: 'inline-block',
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.35)',
            borderRadius: 10,
            padding: '12px 20px',
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#A78BFA',
            }}>
              ⚡ {stats.stat_points} stat {stats.stat_points === 1 ? 'point' : 'points'} ready to spend
            </span>
          </div>
        )}
      </main>
    </motion.div>
  )
}

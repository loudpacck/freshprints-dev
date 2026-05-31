import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import RetroCard from '@/components/retro/RetroCard'
import RetroButton from '@/components/retro/RetroButton'
import RetroBootSequence from '@/components/retro/RetroBootSequence'
import { getFeaturedProjects } from '@/data/projects'

const SERVICE_TILES = [
  { label: 'Engineering',  icon: '⚙', href: '/services/engineering' },
  { label: 'Software',     icon: '💾', href: '/services/software' },
  { label: 'Games',        icon: '🎮', href: '/services/games' },
  { label: 'AI',           icon: '🤖', href: '/services/ai' },
  { label: 'Content',      icon: '📺', href: '/services/content' },
  { label: 'Custom',       icon: '📋', href: '/contact' },
]

function ServiceTile({ label, icon, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--accent)' : 'var(--bg-elevated)',
        border: 'none',
        padding: '8px 4px',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        color: hovered ? 'var(--accent-text)' : 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        boxShadow: `
          inset 1px 1px 0 var(--bevel-highlight),
          inset -1px -1px 0 var(--bevel-dark),
          inset 2px 2px 0 var(--bevel-light),
          inset -2px -2px 0 var(--bevel-shadow)
        `,
        transition: 'background 80ms, color 80ms',
        minHeight: 56,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function ProjectCard({ project, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={hovered ? { y: -2, boxShadow: '5px 5px 0 rgba(0,0,0,0.3)' } : { y: 0, boxShadow: 'var(--shadow-window)' }}
      transition={{ duration: 0.1 }}
    >
      <RetroCard title={project.name} style={{ height: '100%' }}>
        {project.thumbnail && (
          <div style={{
            aspectRatio: '4/3',
            background: '#C0C0C0',
            marginBottom: 8,
            overflow: 'hidden',
          }}>
            <img
              src={project.thumbnail}
              alt={project.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        )}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'var(--text-secondary)',
          margin: '0 0 10px',
          lineHeight: 1.5,
        }}>
          {project.tagline}
        </p>
        <RetroButton onClick={onClick} style={{ fontSize: 11 }}>
          Open →
        </RetroButton>
      </RetroCard>
    </motion.div>
  )
}

export default function RetroLanding() {
  const navigate = useNavigate()
  // Boot sequence replays on every mount — i.e. every navigation to /home in Retro UI.
  const [booting, setBooting] = useState(true)
  const featured = getFeaturedProjects().slice(0, 3)

  if (booting) {
    return <RetroBootSequence onComplete={() => setBooting(false)} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>

      {/* A. Hero panel */}
      <RetroCard title="Welcome — Kyle DeBord">
        <div style={{
          background: 'var(--bg-content)',
          padding: 20,
          boxShadow: 'inset 1px 1px 0 var(--bevel-shadow), inset -1px -1px 0 var(--bevel-highlight)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-display-md)',
            color: 'var(--accent)',
            marginBottom: 16,
            lineHeight: 1.5,
          }}>
            PORTFOLIO
          </div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-md)',
            color: 'var(--text-primary)',
            margin: '0 0 20px',
            maxWidth: 560,
            lineHeight: 1.6,
          }}>
            Hi! I'm Kyle. I build software, games, hardware, and AI experiments.
            Click around — this site is a portfolio of how I think.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <RetroButton variant="primary" onClick={() => navigate('/portfolio')}>
              Browse Work
            </RetroButton>
            <RetroButton onClick={() => navigate('/contact')}>
              Get in Touch
            </RetroButton>
          </div>
        </div>
      </RetroCard>

      {/* B. Featured Work */}
      {featured.length > 0 && (
        <RetroCard title="Featured Work">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {featured.map(project => (
              <ProjectCard
                key={project.slug}
                project={project}
                onClick={() => navigate(`/portfolio/${project.slug}`)}
              />
            ))}
          </div>
        </RetroCard>
      )}

      {/* C. About snippet + D. Services side-by-side on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {/* C. About */}
        <RetroCard title="About Me">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Portrait — Win95 beveled frame */}
            <div style={{
              width: 80,
              height: 80,
              flexShrink: 0,
              boxShadow: `inset -1px -1px 0 var(--bevel-highlight), inset 1px 1px 0 var(--bevel-dark), inset -2px -2px 0 var(--bevel-light), inset 2px 2px 0 var(--bevel-shadow)`,
              overflow: 'hidden',
            }}>
              <img
                src="/images/profile_picture/prof pic 1.jpg"
                alt="Kyle DeBord"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: 'var(--text-primary)',
                margin: '0 0 10px',
                lineHeight: 1.6,
              }}>
                Mechanical designer, software developer, and game developer operating
                under the Fresh Prints brand. I turn ideas into shipped products.
              </p>
              <RetroButton onClick={() => navigate('/about')} style={{ fontSize: 11 }}>
                Read More →
              </RetroButton>
            </div>
          </div>
        </RetroCard>

        {/* D. Services */}
        <RetroCard title="What I Do">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            marginBottom: 10,
          }}>
            {SERVICE_TILES.map(tile => (
              <ServiceTile
                key={tile.label}
                label={tile.label}
                icon={tile.icon}
                onClick={() => navigate(tile.href)}
              />
            ))}
          </div>
        </RetroCard>
      </div>

      {/* E. Contact CTA — dialog box style */}
      <RetroCard title="System Message">
        <div style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}>
          {/* Warning icon */}
          <div style={{
            width: 48,
            height: 48,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}>
            ⚠️
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-md)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              Project? Question? Let's chat.
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              margin: '0 0 12px',
            }}>
              Available for contracting work. Response time typically under 24 hours.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <RetroButton variant="primary" onClick={() => navigate('/contact')}>
                OK
              </RetroButton>
              <RetroButton onClick={() => window.history.back()}>
                Cancel
              </RetroButton>
            </div>
          </div>
        </div>
      </RetroCard>

    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getFeaturedProjects } from '@/data/projects'
import { experiments } from '@/data/labExperiments'
import { socialLinks } from '@/data/socialLinks'
import useReducedMotion from '@/hooks/useReducedMotion'
import StandardButton from '@/components/standard/StandardButton'
import StandardCard from '@/components/standard/StandardCard'

// ─── Engineering motif SVG ───────────────────────────────────────────────────

function EngineeringMotif() {
  return (
    <div className="s-motif" style={{ width: '100%', height: '100%' }}>
      <svg
        viewBox="0 0 480 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-hidden="true"
      >
        {/* Grid lines — horizontal */}
        {[60, 120, 180, 240, 300, 360, 420].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="480" y2={y} stroke="currentColor" strokeWidth="0.5" opacity="0.25"/>
        ))}
        {/* Grid lines — vertical */}
        {[60, 120, 180, 240, 300, 360, 420].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="480" stroke="currentColor" strokeWidth="0.5" opacity="0.25"/>
        ))}

        {/* Center crosshair circle */}
        <circle cx="240" cy="240" r="80" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <circle cx="240" cy="240" r="4"  fill="currentColor" opacity="0.6"/>
        <line x1="240" y1="150" x2="240" y2="330" stroke="currentColor" strokeWidth="0.75" opacity="0.5"/>
        <line x1="150" y1="240" x2="330" y2="240" stroke="currentColor" strokeWidth="0.75" opacity="0.5"/>

        {/* Outer circle */}
        <circle cx="240" cy="240" r="160" stroke="currentColor" strokeWidth="0.75" strokeDasharray="6 4" opacity="0.3"/>

        {/* Corner crosshair marks */}
        {[[60,60],[420,60],[60,420],[420,420]].map(([cx,cy]) => (
          <g key={`${cx}${cy}`}>
            <circle cx={cx} cy={cy} r="12" stroke="currentColor" strokeWidth="0.75" opacity="0.45"/>
            <line x1={cx-8} y1={cy} x2={cx+8} y2={cy} stroke="currentColor" strokeWidth="0.75" opacity="0.45"/>
            <line x1={cx} y1={cy-8} x2={cx} y2={cy+8} stroke="currentColor" strokeWidth="0.75" opacity="0.45"/>
          </g>
        ))}

        {/* Dimension annotation — top */}
        <line x1="60" y1="28" x2="420" y2="28" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <line x1="60" y1="22" x2="60" y2="34" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <line x1="420" y1="22" x2="420" y2="34" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <line x1="240" y1="22" x2="240" y2="34" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3"/>

        {/* Dimension annotation — right */}
        <line x1="452" y1="60" x2="452" y2="420" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <line x1="446" y1="60" x2="458" y2="60" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <line x1="446" y1="420" x2="458" y2="420" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>

        {/* Arc construction lines */}
        <path d="M 120 240 A 120 120 0 0 1 240 120" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" opacity="0.3"/>
        <path d="M 360 240 A 120 120 0 0 1 240 360" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" opacity="0.3"/>

        {/* Mid-ring */}
        <circle cx="240" cy="240" r="40" stroke="currentColor" strokeWidth="0.75" opacity="0.35"/>

        {/* Small point markers along outer circle */}
        {[0, 90, 180, 270].map(deg => {
          const r = 160
          const rad = (deg * Math.PI) / 180
          const x = 240 + r * Math.cos(rad)
          const y = 240 + r * Math.sin(rad)
          return <circle key={deg} cx={x} cy={y} r="3" fill="currentColor" opacity="0.5"/>
        })}
      </svg>
    </div>
  )
}

// ─── Section reveal wrapper ───────────────────────────────────────────────────

function Reveal({ children, delay = 0 }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, y: 24 }}
      whileInView={reduced ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─── Section eyebrow ─────────────────────────────────────────────────────────

function Eyebrow({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--accent)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wider)',
      marginBottom: 'var(--space-3)',
    }}>
      {children}
    </div>
  )
}

// ─── Capability card ─────────────────────────────────────────────────────────

const CAPABILITIES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="8 6 2 12 8 18"   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Software Engineering',
    desc: 'Full-stack web apps, APIs, and production systems. Python, React, FastAPI, PostgreSQL.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Game Development',
    desc: 'Multiplayer mechanics, UE5 Blueprint, Roblox Luau, netcode, and shipped live games.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3"   stroke="currentColor" strokeWidth="2"/>
        <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="2"  x2="12" y2="5"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="2"  y1="12" x2="5"  y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Mechanical Design',
    desc: 'CAD modeling in Siemens NX and Fusion 360. GD&T, DFM review, and physical prototyping.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17l10 5 10-5"           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12l10 5 10-5"           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'AI & Automation',
    desc: 'ML pipelines, scikit-learn, PyTorch, LLM workflows, and intelligent tooling integration.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
        <polygon points="10 8.5 16 12 10 15.5" fill="currentColor"/>
      </svg>
    ),
    title: 'Content Creation',
    desc: 'Devlog series, build documentation, video production, and technical storytelling.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Hardware Prototyping',
    desc: 'FDM printing, 3D scanning, end-to-end prototyping, and small-batch manufacturing.',
  },
]

function CapabilityCard({ icon, title, desc }) {
  return (
    <div style={{
      padding: 'var(--space-6)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}>
      <div style={{ color: 'var(--accent)' }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 'var(--weight-semibold)',
        fontSize: 'var(--text-lg)',
        color: 'var(--text-primary)',
        lineHeight: 'var(--leading-snug)',
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        lineHeight: 'var(--leading-normal)',
      }}>
        {desc}
      </div>
    </div>
  )
}

// ─── View all link ────────────────────────────────────────────────────────────

function ViewAllLink({ href, children }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
      <a
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-medium)',
          fontSize: 'var(--text-base)',
          color: 'var(--accent)',
          textDecoration: 'none',
          padding: 'var(--space-3) var(--space-6)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)',
          transition: 'all 200ms ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--accent-muted)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {children}
      </a>
    </div>
  )
}

// ─── Hero stagger animation ───────────────────────────────────────────────────

function HeroText({ reduced }) {
  const navigate = useNavigate()
  const items = [
    {
      el: (
        <Eyebrow>// CREATIVE ENGINEER · BASED IN MASSACHUSETTS</Eyebrow>
      ),
      delay: 0,
    },
    {
      el: (
        <h1 style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-bold)',
          fontSize: 'var(--text-7xl)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-tight)',
          letterSpacing: 'var(--tracking-tight)',
          margin: '0 0 var(--space-5)',
        }}>
          Software, hardware, and games — built end to end.
        </h1>
      ),
      delay: 0.08,
    },
    {
      el: (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xl)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--leading-relaxed)',
          maxWidth: 520,
          margin: '0 0 var(--space-8)',
        }}>
          I design and build products that span code, mechanics, and AI. From multiplayer Roblox games with thousands of players to UE5 prototypes and CAD-driven hardware. This is a portfolio of how I think.
        </p>
      ),
      delay: 0.16,
    },
    {
      el: (
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <StandardButton size="lg" onClick={() => navigate('/portfolio')}>
            View Work
          </StandardButton>
          <StandardButton variant="secondary" size="lg" onClick={() => navigate('/contact')}>
            Get in Touch
          </StandardButton>
        </div>
      ),
      delay: 0.24,
    },
  ]

  return (
    <div>
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={reduced ? {} : { opacity: 0, y: 16 }}
          animate={reduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: item.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          {item.el}
        </motion.div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StandardLanding() {
  const reduced = useReducedMotion()

  // Featured projects: use featured:true, fallback to first 3
  const featured = getFeaturedProjects().slice(0, 3)
  const displayProjects = featured.length >= 3 ? featured : getFeaturedProjects().concat(
    /* non-featured fallback omitted — data has enough featured */
  ).slice(0, 3)

  // Lab: first 2 experiments
  const labPreviews = experiments.slice(0, 2)

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── A. Hero ─────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: 'calc(100vh - var(--nav-height))',
          background: 'var(--gradient-hero)',
          display: 'flex',
          alignItems: 'center',
          paddingTop: 'var(--space-16)',
          paddingBottom: 'var(--space-16)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--container-max)',
            margin: '0 auto',
            padding: '0 var(--space-8)',
            width: '100%',
          }}
        >
          <div className="s-hero-grid">
            {/* Left: text */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <HeroText reduced={reduced} />
            </div>

            {/* Right: motif */}
            <motion.div
              initial={reduced ? {} : { opacity: 0 }}
              animate={reduced ? {} : { opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              style={{
                color: 'var(--border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: '100%', maxWidth: 440, aspectRatio: '1' }}>
                <EngineeringMotif />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── B. Featured Work ─────────────────────────────────────────────── */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--space-8)' }}>
          <Reveal>
            <Eyebrow>// SELECTED WORK</Eyebrow>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-4xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-3)',
            }}>
              Recent Builds
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-10)',
              maxWidth: 600,
              lineHeight: 'var(--leading-normal)',
            }}>
              A small selection. There's more — but these are the ones I'd want a stranger to see first.
            </p>
          </Reveal>

          <div className="s-grid-3">
            {displayProjects.map((project, i) => (
              <Reveal key={project.slug} delay={i * 0.07}>
                <StandardCard
                  image={project.thumbnail}
                  eyebrow={project.category[0]}
                  title={project.name}
                  description={project.tagline}
                  href={`/portfolio/${project.slug}`}
                  status={project.status}
                />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <ViewAllLink href="/portfolio">View All Work →</ViewAllLink>
          </Reveal>
        </div>
      </section>

      {/* ── C. Capabilities ──────────────────────────────────────────────── */}
      <section className="s-section" style={{ background: 'var(--bg-elevated)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--space-8)' }}>
          <Reveal>
            <Eyebrow>// WHAT I DO</Eyebrow>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-4xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-3)',
            }}>
              Capabilities
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-10)',
              maxWidth: 520,
              lineHeight: 'var(--leading-normal)',
            }}>
              Six lanes of work — most projects cross at least three of them.
            </p>
          </Reveal>

          <div className="s-cap-grid">
            {CAPABILITIES.map((cap, i) => (
              <Reveal key={cap.title} delay={i * 0.05}>
                <CapabilityCard {...cap} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.25}>
            <ViewAllLink href="/services">Explore services & packages →</ViewAllLink>
          </Reveal>
        </div>
      </section>

      {/* ── D. About snippet ─────────────────────────────────────────────── */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--space-8)' }}>
          <div className="s-about-grid">
            {/* Portrait block */}
            <Reveal>
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-2xl)',
                aspectRatio: '4/5',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: 'var(--space-5)',
                border: '1px solid var(--border-subtle)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <img
                  src="/images/profile_picture/prof%20pic%201.jpg"
                  alt="Kyle DeBord"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    borderRadius: 'var(--radius-2xl)',
                  }}
                />
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  position: 'relative',
                  zIndex: 1,
                  textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                }}>
                  // KYLE DEBORD
                </div>
              </div>
            </Reveal>

            {/* About text */}
            <Reveal delay={0.1}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <Eyebrow>// ABOUT</Eyebrow>
                <h2 style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 'var(--weight-semibold)',
                  fontSize: 'var(--text-3xl)',
                  color: 'var(--text-primary)',
                  letterSpacing: 'var(--tracking-tight)',
                  lineHeight: 'var(--leading-snug)',
                  marginBottom: 'var(--space-6)',
                }}>
                  I build across disciplines because the most interesting problems live in between them.
                </h2>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  marginBottom: 'var(--space-4)',
                }}>
                  I'm a mechanical designer who writes production software, a software developer who builds games, and a game developer who thinks in CAD. I started in engineering — tolerances, materials, manufacturing constraints — and ended up writing ML models and shipping multiplayer games.
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  marginBottom: 'var(--space-4)',
                }}>
                  The through-line is building things that work — not just demos. I care about the last 10% as much as the first 90, which is rare when you span this many domains.
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  marginBottom: 'var(--space-8)',
                }}>
                  Fresh Prints is the umbrella — engineering prototypes, software products, and game projects all under one roof. I work with individuals, studios, and companies who need someone who can own a problem end to end.
                </p>
                <a
                  href="/about"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 'var(--weight-medium)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--accent)',
                    textDecoration: 'none',
                  }}
                >
                  Read the full story →
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── E. From the Lab ──────────────────────────────────────────────── */}
      <section className="s-section" style={{ background: 'var(--bg-elevated)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--space-8)' }}>
          <Reveal>
            <Eyebrow>// THE LAB</Eyebrow>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-4xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-3)',
            }}>
              Experiments in Progress
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-10)',
              maxWidth: 560,
              lineHeight: 'var(--leading-normal)',
            }}>
              Active research. Some will become products. Most won't. All of them teach me something.
            </p>
          </Reveal>

          <div className="s-grid-2">
            {labPreviews.map((exp, i) => (
              <Reveal key={exp.slug} delay={i * 0.08}>
                <StandardCard
                  eyebrow={exp.category}
                  title={exp.name}
                  description={exp.description}
                  href={`/lab/${exp.slug}`}
                  status={exp.status}
                />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <ViewAllLink href="/lab">Explore the Lab →</ViewAllLink>
          </Reveal>
        </div>
      </section>

      {/* ── F. Contact CTA ───────────────────────────────────────────────── */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--space-8)' }}>
          <Reveal>
            <div style={{
              maxWidth: 720,
              margin: '0 auto',
              textAlign: 'center',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-16) var(--space-10)',
              border: '1px solid var(--border-subtle)',
              backgroundImage: 'var(--gradient-hero)',
            }}>
              <Eyebrow>// AVAILABLE</Eyebrow>
              <h2 style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--weight-bold)',
                fontSize: 'var(--text-5xl)',
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
                lineHeight: 'var(--leading-tight)',
                marginBottom: 'var(--space-4)',
              }}>
                Have a hard problem? Let's talk.
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-normal)',
                marginBottom: 'var(--space-10)',
              }}>
                I take on freelance and consulting work for genuinely interesting projects. Tell me about yours.
              </p>
              <div style={{
                display: 'flex',
                gap: 'var(--space-4)',
                justifyContent: 'center',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                <StandardButton size="lg" href="/contact">
                  Start a Conversation
                </StandardButton>
                <a
                  href={`mailto:${socialLinks.email}`}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 'var(--weight-medium)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  {socialLinks.email}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Responsive layout CSS */}
      <style>{`
        .s-hero-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 4rem;
          align-items: center;
        }
        .s-about-grid {
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: 4rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .s-hero-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .s-hero-grid > *:last-child {
            display: none;
          }
          .s-about-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }
      `}</style>
    </motion.div>
  )
}

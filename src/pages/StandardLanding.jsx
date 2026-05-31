import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getFeaturedProjects } from '@/data/projects'
import { skillTiers } from '@/data/skills'
import { services } from '@/data/services'
import { siteStatus } from '@/data/siteStatus'
import { socialLinks } from '@/data/socialLinks'
import { getCategoryColor } from '@/utils/categoryAssets'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'
import StandardCard from '@/components/standard/StandardCard'
import StandardSectionHeader from '@/components/standard/StandardSectionHeader'

const EASE = [0.16, 1, 0.3, 1]
const CONTAINER = { maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--space-8)' }

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
        {[60, 120, 180, 240, 300, 360, 420].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="480" y2={y} stroke="currentColor" strokeWidth="0.5" opacity="0.25"/>
        ))}
        {[60, 120, 180, 240, 300, 360, 420].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="480" stroke="currentColor" strokeWidth="0.5" opacity="0.25"/>
        ))}
        <circle cx="240" cy="240" r="80" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <circle cx="240" cy="240" r="4"  fill="currentColor" opacity="0.6"/>
        <line x1="240" y1="150" x2="240" y2="330" stroke="currentColor" strokeWidth="0.75" opacity="0.5"/>
        <line x1="150" y1="240" x2="330" y2="240" stroke="currentColor" strokeWidth="0.75" opacity="0.5"/>
        <circle cx="240" cy="240" r="160" stroke="currentColor" strokeWidth="0.75" strokeDasharray="6 4" opacity="0.3"/>
        {[[60,60],[420,60],[60,420],[420,420]].map(([cx,cy]) => (
          <g key={`${cx}${cy}`}>
            <circle cx={cx} cy={cy} r="12" stroke="currentColor" strokeWidth="0.75" opacity="0.45"/>
            <line x1={cx-8} y1={cy} x2={cx+8} y2={cy} stroke="currentColor" strokeWidth="0.75" opacity="0.45"/>
            <line x1={cx} y1={cy-8} x2={cx} y2={cy+8} stroke="currentColor" strokeWidth="0.75" opacity="0.45"/>
          </g>
        ))}
        <line x1="60" y1="28" x2="420" y2="28" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <line x1="60" y1="22" x2="60" y2="34" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <line x1="420" y1="22" x2="420" y2="34" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <line x1="240" y1="22" x2="240" y2="34" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3"/>
        <line x1="452" y1="60" x2="452" y2="420" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <line x1="446" y1="60" x2="458" y2="60" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <line x1="446" y1="420" x2="458" y2="420" stroke="currentColor" strokeWidth="0.75" opacity="0.4"/>
        <path d="M 120 240 A 120 120 0 0 1 240 120" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" opacity="0.3"/>
        <path d="M 360 240 A 120 120 0 0 1 240 360" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" opacity="0.3"/>
        <circle cx="240" cy="240" r="40" stroke="currentColor" strokeWidth="0.75" opacity="0.35"/>
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

// ─── Editorial arrow link ──────────────────────────────────────────────────

function ArrowLink({ href, children }) {
  const [hover, setHover] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        letterSpacing: 'var(--tracking-wide)',
        color: 'var(--accent)',
        textDecoration: 'none',
        paddingBottom: 'var(--space-1)',
        borderBottom: '1px solid',
        borderColor: hover ? 'var(--accent)' : 'transparent',
        transition: 'border-color var(--duration-fast) var(--ease-standard)',
      }}
    >
      {children}
    </a>
  )
}

// ─── Availability signal (live from siteStatus) ──────────────────────────────

function AvailabilityPill() {
  const isOpen = siteStatus.availability === 'OPEN'
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-2) var(--space-4)',
      border: '1px solid var(--border-strong)',
      borderRadius: '999px',
      background: 'var(--bg-card)',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: isOpen ? 'var(--color-status-active)' : 'var(--accent-amber)',
        flexShrink: 0,
        boxShadow: isOpen ? '0 0 8px var(--color-status-active)' : 'none',
      }} />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--label-size)',
        letterSpacing: 'var(--label-tracking)',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
      }}>
        {siteStatus.availability}
        <span style={{ color: 'var(--text-quaternary)' }}> · {siteStatus.availabilityNote}</span>
      </span>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ reduced }) {
  const navigate = useNavigate()
  const items = [
    // Dual-brand eyebrow — Kyle (freelance) + Fresh Prints (prototyping)
    (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-6)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--label-size)', letterSpacing: 'var(--label-tracking)', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--accent)' }}>Kyle DeBord</span>
          <span style={{ color: 'var(--text-tertiary)' }}> — Software · AI · Games</span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--label-size)', letterSpacing: 'var(--label-tracking)', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--accent-amber)' }}>Fresh Prints</span>
          <span style={{ color: 'var(--text-tertiary)' }}> — Prototyping & Design</span>
        </span>
      </div>
    ),
    (
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 'var(--weight-extrabold)',
        fontSize: 'var(--display-xl)',
        color: 'var(--text-primary)',
        lineHeight: 'var(--leading-display)',
        letterSpacing: 'var(--tracking-display)',
        margin: '0 0 var(--space-6)',
      }}>
        I build across software, AI, games, and hardware — end to end.
      </h1>
    ),
    (
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-xl)',
        color: 'var(--text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
        maxWidth: 'var(--measure-prose)',
        margin: '0 0 var(--space-7)',
      }}>
        From multiplayer games with thousands of players to ML prediction systems and
        CAD-driven hardware — a multidisciplinary builder who owns the whole problem.
      </p>
    ),
    (
      <div style={{ marginBottom: 'var(--space-7)' }}>
        <AvailabilityPill />
      </div>
    ),
    (
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <StandardButton size="lg" onClick={() => navigate('/contact')}>
          Get in Touch →
        </StandardButton>
        <StandardButton variant="secondary" size="lg" onClick={() => navigate('/portfolio')}>
          See the Work
        </StandardButton>
      </div>
    ),
  ]

  return (
    <section style={{
      minHeight: 'calc(100vh - var(--nav-height))',
      background: 'var(--gradient-hero)',
      display: 'flex',
      alignItems: 'center',
      paddingTop: 'var(--space-12)',
      paddingBottom: 'var(--space-12)',
    }}>
      <div style={{ ...CONTAINER, width: '100%' }}>
        <div className="s-hero-grid">
          <div>
            {items.map((el, i) => (
              <motion.div
                key={i}
                initial={reduced ? {} : { opacity: 0, y: 16 }}
                animate={reduced ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
              >
                {el}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={reduced ? {} : { opacity: 0 }}
            animate={reduced ? {} : { opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            style={{ color: 'var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ width: '100%', aspectRatio: '1' }}>
              <EngineeringMotif />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Discipline row (editorial list) ──────────────────────────────────────────

function DisciplineRow({ index, label, desc, first }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="s-disc-row"
      style={{
        borderTop: first ? 'none' : '1px solid var(--hairline)',
        padding: 'var(--space-5) 0',
        alignItems: 'baseline',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--label-size)',
        color: hover ? 'var(--accent)' : 'var(--text-tertiary)',
        letterSpacing: 'var(--label-tracking)',
        transition: 'color var(--duration-fast) var(--ease-standard)',
      }}>
        {index}
      </span>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--display-sm)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--text-primary)',
        letterSpacing: 'var(--tracking-tight)',
        lineHeight: 'var(--leading-tight)',
        margin: 0,
      }}>
        {label}
      </h3>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-base)',
        color: 'var(--text-secondary)',
        lineHeight: 'var(--leading-normal)',
        margin: 0,
      }}>
        {desc}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StandardLanding() {
  const reduced = useReducedMotion()
  const featured = getFeaturedProjects().slice(0, 4)
  const disciplines = skillTiers.disciplines

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── A. Hero ─────────────────────────────────────────────────────── */}
      <Hero reduced={reduced} />

      {/* ── B. Featured Work ─────────────────────────────────────────────── */}
      <section className="s-section" style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={CONTAINER}>
          <Reveal>
            <StandardSectionHeader
              index="01"
              eyebrow="Selected Work"
              heading="Recent builds"
              subtitle="A small selection across every discipline — the ones I'd want a stranger to see first."
            />
          </Reveal>

          <div className="s-feat-grid">
            {featured.map((project, i) => (
              <Reveal key={project.slug} delay={i * 0.06}>
                <StandardCard
                  image={project.thumbnail}
                  eyebrow={project.category[0]}
                  title={project.name}
                  description={project.tagline}
                  href={`/portfolio/${project.slug}`}
                  status={project.status}
                  accentColor={getCategoryColor(project.category[0])}
                  metric={project.metrics?.[0]}
                />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div style={{ marginTop: 'var(--space-8)' }}>
              <ArrowLink href="/portfolio">View all work →</ArrowLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── C. Range / Capabilities ──────────────────────────────────────── */}
      <section className="s-section" style={{ background: 'var(--bg-elevated)' }}>
        <div style={CONTAINER}>
          <Reveal>
            <StandardSectionHeader
              index="02"
              eyebrow="Capabilities"
              heading="What I do"
              subtitle="Five disciplines — most projects cross at least three of them."
            />
          </Reveal>

          <Reveal>
            <div>
              {disciplines.map((d, i) => (
                <DisciplineRow
                  key={d.id}
                  index={String(i + 1).padStart(2, '0')}
                  label={d.label}
                  desc={d.description}
                  first={i === 0}
                />
              ))}
            </div>
          </Reveal>

          {/* Services teaser */}
          <Reveal delay={0.1}>
            <div style={{
              marginTop: 'var(--space-8)',
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--border-strong)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-5)',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {services.map(s => (
                  <a
                    key={s.id}
                    href={`/services/${s.category}`}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wide)',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      padding: 'var(--space-2) var(--space-3)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {s.name}
                  </a>
                ))}
              </div>
              <ArrowLink href="/services">Services & packages →</ArrowLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── D. About snippet ─────────────────────────────────────────────── */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div style={CONTAINER}>
          <div className="s-about-grid">
            <Reveal>
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-xl)',
                aspectRatio: '4/5',
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
                  }}
                />
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--label-size)',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--label-tracking)',
                  marginBottom: 'var(--space-4)',
                }}>
                  About
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 'var(--weight-bold)',
                  fontSize: 'var(--display-md)',
                  color: 'var(--text-primary)',
                  letterSpacing: 'var(--tracking-display)',
                  lineHeight: 'var(--leading-display)',
                  margin: '0 0 var(--space-6)',
                }}>
                  The interesting problems live between disciplines.
                </h2>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  margin: '0 0 var(--space-4)',
                  maxWidth: 'var(--measure-prose)',
                }}>
                  I'm a mechanical designer who writes production software, a software developer who
                  builds games, and a game developer who thinks in CAD. I started in engineering —
                  tolerances, materials, manufacturing — and ended up shipping ML models and multiplayer games.
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  margin: '0 0 var(--space-7)',
                  maxWidth: 'var(--measure-prose)',
                }}>
                  Fresh Prints is the umbrella — engineering prototypes, software products, and game
                  projects under one roof, for people who need someone who can own a problem end to end.
                </p>
                <ArrowLink href="/about">Read the full story →</ArrowLink>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── E. Closing CTA ───────────────────────────────────────────────── */}
      <section className="s-section" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={CONTAINER}>
          <Reveal>
            <div style={{
              maxWidth: 'var(--container-max)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-14) var(--space-10)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--gradient-hero), var(--bg-card)',
              textAlign: 'center',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
                <AvailabilityPill />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--weight-extrabold)',
                fontSize: 'var(--display-lg)',
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-display)',
                lineHeight: 'var(--leading-display)',
                margin: '0 auto var(--space-5)',
                maxWidth: 'var(--measure-prose)',
              }}>
                Have a hard problem? Let's build it.
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-normal)',
                margin: '0 auto var(--space-8)',
                maxWidth: 'var(--measure-prose)',
              }}>
                I take on freelance and consulting work for genuinely interesting projects. Tell me about yours.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                <StandardButton size="lg" href="/contact">Start a Conversation →</StandardButton>
                <a
                  href={`mailto:${socialLinks.email}`}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-sm)',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color var(--duration-fast) var(--ease-standard)',
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

      {/* Responsive layout CSS — scoped to Standard */}
      <style>{`
        [data-ui="standard"] .s-hero-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: var(--space-12);
          align-items: center;
        }
        [data-ui="standard"] .s-feat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-6);
        }
        [data-ui="standard"] .s-about-grid {
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: var(--space-10);
          align-items: center;
        }
        [data-ui="standard"] .s-disc-row {
          display: grid;
          grid-template-columns: var(--space-8) minmax(0, 1fr) minmax(0, 1.4fr);
          gap: var(--space-5);
        }
        @media (max-width: 900px) {
          [data-ui="standard"] .s-hero-grid {
            grid-template-columns: 1fr;
            gap: var(--space-8);
          }
          [data-ui="standard"] .s-hero-grid > *:last-child {
            display: none;
          }
          [data-ui="standard"] .s-about-grid {
            grid-template-columns: 1fr;
            gap: var(--space-7);
          }
          [data-ui="standard"] .s-disc-row {
            grid-template-columns: var(--space-7) 1fr;
            row-gap: var(--space-2);
          }
          [data-ui="standard"] .s-disc-row > p {
            grid-column: 2 / 3;
          }
        }
        @media (max-width: 640px) {
          [data-ui="standard"] .s-feat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </motion.div>
  )
}

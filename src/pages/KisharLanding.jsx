import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProjectBySlug } from '@/data/projects'
import { siteStatus } from '@/data/siteStatus'
import useReducedMotion from '@/hooks/useReducedMotion'
import { formatEyebrow } from '@/utils/eyebrow'
import KisharButton from '@/components/kishar/KisharButton'
import KisharCard from '@/components/kishar/KisharCard'
import KisharSectionRule from '@/components/kishar/KisharSectionRule'

const EASE = [0.16, 1, 0.3, 1]

// Same curated list StandardLanding uses — the hero names a Roblox game and
// parts cut in Siemens NX, so Hot Potato and Fresh Prints have to be under it.
const LANDING_FEATURED = [
  'hot-potato',
  'fresh-prints-prototypes',
  'predictinator-5000',
  'lexis-nails',
]

// Same artifact StandardLanding leads with.
const HERO_IMAGE = {
  src: '/images/Hot Potato/Roblox Page.webp',
  alt: 'The Hot Potato experience page on Roblox',
  caption: 'Hot Potato — live on Roblox',
}

const identityLabel = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--label-size)',
  letterSpacing: 'var(--label-tracking)',
  textTransform: 'uppercase',
}

function Eyebrow({ children, style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-size)',
      letterSpacing: 'var(--label-tracking)',
      textTransform: 'uppercase',
      color: 'var(--accent-ink)',
      ...style,
    }}>
      {formatEyebrow(children, 'kishar')}
    </div>
  )
}

function AvailabilityPill() {
  const isOpen = siteStatus.availability === 'OPEN'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-2) var(--space-4)',
      border: '1px solid var(--border-inner)',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-card)',
      boxShadow: 'var(--bevel-in)',
    }}>
      <span style={{
        width: 8, height: 8,
        background: isOpen ? 'var(--color-status-active)' : 'var(--text-tertiary)',
        transform: 'rotate(45deg)',
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--label-size)',
        letterSpacing: 'var(--label-tracking)',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
      }}>
        {siteStatus.availability}
        <span style={{ color: 'var(--text-tertiary)' }}> · {siteStatus.availabilityNote}</span>
      </span>
    </span>
  )
}

// A framed plate: the hero photo inside the same double frame the cards use.
function HeroPlate() {
  const [failed, setFailed] = useState(false)
  return (
    <figure style={{ margin: 0, width: '100%' }}>
      <KisharCard padding="0" texture={null} style={{ overflow: 'hidden' }}>
        <div style={{ aspectRatio: '4/3', background: 'var(--bg-elevated)' }}>
          {!failed && (
            <img
              src={HERO_IMAGE.src}
              alt={HERO_IMAGE.alt}
              decoding="async"
              onError={() => setFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
      </KisharCard>
      <figcaption style={{
        marginTop: 'var(--space-3)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--label-size)',
        letterSpacing: 'var(--label-tracking)',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
      }}>
        {HERO_IMAGE.caption}
      </figcaption>
    </figure>
  )
}

function ProjectPlate({ project }) {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  return (
    <KisharCard padding="0" texture={null} style={{ height: '100%', cursor: 'pointer' }}>
      <a
        href={`/portfolio/${project.slug}`}
        onClick={(e) => { e.preventDefault(); navigate(`/portfolio/${project.slug}`) }}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none' }}
      >
        <div style={{ aspectRatio: '16/10', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
          {!failed && (
            <img
              src={project.thumbnail}
              alt={project.name}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--label-size)',
            letterSpacing: 'var(--label-tracking)',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}>
            {project.category[0]} · {String(project.status).replace(/_/g, ' ')}
          </span>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--display-sm)',
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            {project.name}
          </h3>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-normal)',
            margin: 0,
          }}>
            {project.tagline}
          </p>
        </div>
      </a>
    </KisharCard>
  )
}

export default function KisharLanding() {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const featured = LANDING_FEATURED.map(getProjectBySlug).filter(Boolean)

  const rise = (i = 0) => ({
    initial: reduced ? {} : { opacity: 0, y: 14 },
    animate: reduced ? {} : { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay: i * 0.08, ease: EASE },
  })

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 'var(--space-12)',
        paddingBottom: 'var(--space-12)',
      }}>
        <div className="s-container" style={{ width: '100%' }}>
          <div className="k-hero-grid">
            <div>
              <motion.div {...rise(0)}>
                {/* Plain labels, not inscriptions: these two lines already carry
                    their own middot separators, and the flanking marks the
                    kishar eyebrow adds would collide with them. The inscription
                    form is reserved for section eyebrows below. */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-6)' }}>
                  <div style={identityLabel}>
                    <span style={{ color: 'var(--accent-ink)' }}>Kyle DeBord</span>
                    <span style={{ color: 'var(--text-tertiary)' }}> — Software · AI · Games</span>
                  </div>
                  <div style={identityLabel}>
                    <span style={{ color: 'var(--text-primary)' }}>Fresh Prints</span>
                    <span style={{ color: 'var(--text-tertiary)' }}> — Prototyping &amp; Design</span>
                  </div>
                </div>
              </motion.div>

              <motion.h1 {...rise(1)} style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--weight-bold)',
                fontSize: 'var(--display-xl)',
                color: 'var(--text-primary)',
                lineHeight: 'var(--leading-display)',
                letterSpacing: 'var(--tracking-display)',
                margin: '0 0 var(--space-6)',
              }}>
                I take a project from the CAD file to the live URL.
              </motion.h1>

              <motion.p {...rise(2)} style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xl)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
                maxWidth: 'var(--measure-prose)',
                margin: '0 0 var(--space-7)',
              }}>
                Contract work in both directions — Hot Potato hit 2,000 players on Roblox,
                Fresh Prints has produced 50+ parts.
              </motion.p>

              <motion.div {...rise(3)} style={{ marginBottom: 'var(--space-7)' }}>
                <AvailabilityPill />
              </motion.div>

              <motion.div {...rise(4)} style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <KisharButton size="lg" href="/hire">Start a Commission</KisharButton>
                <KisharButton size="lg" variant="secondary" href="/contact">Send a Message</KisharButton>
              </motion.div>
            </div>

            <motion.div
              initial={reduced ? {} : { opacity: 0 }}
              animate={reduced ? {} : { opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.35 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <HeroPlate />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Featured work ────────────────────────────────────────────────── */}
      <section className="s-section" style={{ paddingTop: 0 }}>
        <div className="s-container">
          <KisharSectionRule margin="0 0 var(--space-10)" />

          <Eyebrow style={{ marginBottom: 'var(--space-3)' }}>Selected Work</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--display-md)',
            color: 'var(--text-primary)',
            margin: '0 0 var(--space-4)',
          }}>
            Recent builds
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-secondary)',
            maxWidth: 'var(--measure-prose)',
            margin: '0 0 var(--space-8)',
          }}>
            A small selection across every discipline — the ones I'd want a stranger to see first.
          </p>

          <div className="k-feat-grid">
            {featured.map(project => (
              <ProjectPlate key={project.slug} project={project} />
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-8)' }}>
            <KisharButton variant="ghost" href="/portfolio">View all work →</KisharButton>
          </div>
        </div>
      </section>

      {/* ── Pantheon Wars ────────────────────────────────────────────────── */}
      <section className="s-section" style={{ paddingTop: 0 }}>
        <div className="s-container">
          <KisharSectionRule margin="0 0 var(--space-10)" />

          <KisharCard padding="var(--space-10)">
            <div className="k-game-grid">
              <div>
                <Eyebrow style={{ marginBottom: 'var(--space-3)' }}>The Game This Interface Came From</Eyebrow>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--display-md)',
                  color: 'var(--text-primary)',
                  margin: '0 0 var(--space-4)',
                }}>
                  Pantheon Wars
                </h2>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  maxWidth: 'var(--measure-prose)',
                  margin: '0 0 var(--space-6)',
                }}>
                  A persistent Greek-mythology browser MMO I wrote end to end — Postgres schema,
                  serverless API, quests, loot, PvP, alliances. It has real players on it right now.
                  This interface borrows its palette.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <KisharButton
                    onClick={() => navigate('/games/pantheon-wars', { state: { from: 'external' } })}
                  >
                    Play Pantheon Wars
                  </KisharButton>
                  <KisharButton variant="secondary" href="/portfolio/pantheon">
                    Read the build
                  </KisharButton>
                </div>
              </div>

              <ul style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                borderLeft: '1px solid var(--border-inner)',
                paddingLeft: 'var(--space-6)',
              }}>
                {[
                  ['Stack', 'React · Vercel functions · Postgres'],
                  ['Systems', 'Quests, inventory, shop, temples, PvP, alliances'],
                  ['Status', 'Live and played'],
                ].map(([k, v]) => (
                  <li key={k}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--label-size)',
                      letterSpacing: 'var(--label-tracking)',
                      textTransform: 'uppercase',
                      color: 'var(--accent-ink)',
                      marginBottom: 'var(--space-1)',
                    }}>
                      {k}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--text-secondary)',
                    }}>
                      {v}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </KisharCard>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <section className="s-section" style={{ paddingTop: 0 }}>
        <div className="s-container">
          <KisharSectionRule margin="0 0 var(--space-10)" />

          <KisharCard padding="var(--space-14) var(--space-10)" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
              <AvailabilityPill />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--display-lg)',
              color: 'var(--text-primary)',
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
              I take contract work where the problem crosses domains — hardware that needs
              software, or software that needs a physical part.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <KisharButton size="lg" href="/hire">Start a Commission</KisharButton>
              <KisharButton size="lg" variant="secondary" href="/contact">Send a Message</KisharButton>
            </div>
          </KisharCard>
        </div>
      </section>

      <style>{`
        [data-ui="kishar"] .k-hero-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: var(--space-12);
          align-items: center;
        }
        [data-ui="kishar"] .k-feat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-6);
        }
        [data-ui="kishar"] .k-game-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: var(--space-8);
          align-items: start;
        }
        @media (max-width: 900px) {
          [data-ui="kishar"] .k-hero-grid { grid-template-columns: 1fr; gap: var(--space-8); }
          [data-ui="kishar"] .k-hero-grid > *:last-child { display: none; }
          [data-ui="kishar"] .k-game-grid { grid-template-columns: 1fr; }
          [data-ui="kishar"] .k-game-grid > ul {
            border-left: none;
            border-top: 1px solid var(--border-inner);
            padding-left: 0;
            padding-top: var(--space-6);
          }
        }
        @media (max-width: 640px) {
          [data-ui="kishar"] .k-feat-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </motion.div>
  )
}

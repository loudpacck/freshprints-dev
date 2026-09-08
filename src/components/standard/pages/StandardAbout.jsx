import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { socialList } from '@/data/socialLinks'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useTheme } from '@/themes/useTheme'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'
import IntakeWizard from '@/components/services/IntakeWizard'
import StandardCapabilityMatrix from '@/components/standard/StandardCapabilityMatrix'

const SOCIAL_ICONS = {
  email: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
      <polyline points="2 9 12 15 22 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'youtube-main': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <polygon points="10 8.5 16 12 10 15.5" fill="currentColor"/>
    </svg>
  ),
  'youtube-docs': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <polygon points="10 8.5 16 12 10 15.5" fill="currentColor"/>
    </svg>
  ),
  github: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
}

export default function StandardAbout() {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const [wizardOpen, setWizardOpen] = useState(false)
  const { themeId } = useTheme()
  const isRetro = themeId === 'retro'

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero */}
      <section style={{
        paddingTop: 'var(--space-16)',
        paddingBottom: 'var(--space-10)',
        background: 'var(--gradient-hero)',
      }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              marginBottom: 'var(--space-3)',
            }}>
              // ABOUT
            </div>
            <h1 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-6xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
              marginBottom: 'var(--space-4)',
            }}>
              Kyle DeBord
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: 600,
              lineHeight: 'var(--leading-normal)',
              marginBottom: 'var(--space-3)',
            }}>
              Creative engineer working across software, games, hardware, and AI.
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}>
              Currently building freshprints.dev and Jogger — available for select consulting work.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Portrait + Intro */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <div className="sa-portrait-grid">
            <Reveal>
              {isRetro ? (
                <div>
                  <div style={{
                    boxShadow: 'inset 1px 1px 0 var(--bevel-highlight), inset -1px -1px 0 var(--bevel-dark), inset 2px 2px 0 var(--bevel-light), inset -2px -2px 0 var(--bevel-shadow)',
                    background: 'var(--bg-elevated)',
                    position: 'relative',
                    overflow: 'hidden',
                    aspectRatio: '4/5',
                  }}>
                    <img
                      src="/images/profile_picture/prof%20pic%201.jpg"
                      alt="Kyle DeBord"
                      loading="lazy"
                      decoding="async"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        display: 'block',
                      }}
                    />
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    color: 'var(--text-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: 'var(--space-2)',
                  }}>
                    // KYLE.JPG
                  </div>
                </div>
              ) : (
                <div style={{
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
                  background: 'var(--bg-elevated)',
                }}>
                  <img
                    src="/images/profile_picture/prof%20pic%201.jpg"
                    alt="Kyle DeBord"
                    loading="lazy"
                    decoding="async"
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
                    // KYLE DEBORD · BASED IN MASSACHUSETTS
                  </div>
                </div>
              )}
            </Reveal>

            <Reveal delay={0.1}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  marginBottom: 'var(--space-5)',
                }}>
                  I'm a mechanical designer who writes production software, a software developer who builds games, and a game developer who thinks in CAD. I started in engineering — tolerances, materials, manufacturing constraints — and ended up shipping ML models and multiplayer games.
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  marginBottom: 'var(--space-5)',
                }}>
                  The through-line is building things that actually work — not just demos. I care about the last 10% as much as the first 90%, which is rare when you span this many domains.
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  Fresh Prints is the umbrella — engineering prototypes, software products, and game projects all under one roof.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="s-section" style={{ background: 'var(--bg-elevated)' }}>
        <div className="s-container">
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Reveal>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                marginBottom: 'var(--space-4)',
              }}>
                // THE STORY
              </div>
              <h2 style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--weight-semibold)',
                fontSize: 'var(--text-4xl)',
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
                lineHeight: 'var(--leading-snug)',
                marginBottom: 'var(--space-8)',
              }}>
                How I Got Here
              </h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
                marginBottom: 'var(--space-6)',
              }}>
                I came up through mechanical design — physical parts, real constraints, things that had to actually work when manufactured. That foundation forced precision into my thinking before I ever wrote a line of code in a professional context.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
                marginBottom: 'var(--space-6)',
              }}>
                Software came next — first as tooling to automate my own engineering workflows, then as the main product. I built internal dashboards, APIs, and eventually full-stack applications. Games followed: Roblox first for the rapid feedback loop, then Unreal Engine 5 for the depth.
              </p>
            </Reveal>
            <Reveal delay={0.11}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
              }}>
                AI entered the picture through necessity — I needed prediction models, computer vision pipelines, and LLM integrations before they were popular to add to a resume. Now it's integral to almost everything I build. Fresh Prints is the result of a decade of building across all of it.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Capabilities — merged from the retired /skills page */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              marginBottom: 'var(--space-3)',
            }}>
              // WHAT I DO
            </div>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-4xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-4)',
            }}>
              What I Build
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-normal)',
              maxWidth: 600,
              marginBottom: 'var(--space-8)',
            }}>
              Five disciplines, dozens of tools, and the work that proves them.
            </p>
          </Reveal>
          <StandardCapabilityMatrix />
        </div>
      </section>

      {/* Connect */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              marginBottom: 'var(--space-3)',
            }}>
              // CONNECT
            </div>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-4xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-10)',
            }}>
              Find Me
            </h2>
          </Reveal>
          <div className="s-grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {socialList.map((link, i) => (
              <Reveal key={link.id} delay={i * 0.05}>
                <a
                  href={link.url}
                  target={link.url.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-5)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    textDecoration: 'none',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--border-accent)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ color: 'var(--accent)' }}>
                    {SOCIAL_ICONS[link.id] || SOCIAL_ICONS.email}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 'var(--weight-semibold)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-1)',
                    }}>
                      {link.label}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                    }}>
                      {link.handle}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    marginTop: 'auto',
                  }}>
                    {link.description}
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="s-section" style={{ background: 'var(--bg-elevated)' }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              maxWidth: 600,
              margin: '0 auto',
              textAlign: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-12) var(--space-8)',
              backgroundImage: 'var(--gradient-hero)',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--weight-bold)',
                fontSize: 'var(--text-4xl)',
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
                marginBottom: 'var(--space-4)',
              }}>
                Let's Build Something
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-normal)',
                marginBottom: 'var(--space-8)',
              }}>
                I take on freelance work for genuinely interesting projects.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <StandardButton size="lg" href="/contact">Start a Conversation</StandardButton>
                <StandardButton variant="secondary" size="lg" onClick={() => setWizardOpen(true)}>
                  Project Inquiry
                </StandardButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {wizardOpen && <IntakeWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />}

      <style>{`
        .sa-portrait-grid {
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: var(--space-12);
          align-items: start;
        }
        @media (max-width: 900px) {
          .sa-portrait-grid {
            grid-template-columns: 1fr;
            gap: var(--space-8);
          }
        }
      `}</style>
    </motion.div>
  )
}

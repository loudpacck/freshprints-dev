import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/themes/useTheme'
import { getCompleteThemes, getTheme } from '@/themes/registry'

const THEME_DESCS = {
  standard: 'Premium portfolio experience',
  digital:  'Hub-based command center',
  retro:    'A nostalgic 90s computer experience',
}

const THEME_PREVIEWS = {
  standard: {
    bg: '#FFFFFF',
    accent: '#1E3C64',
    label: 'Standard',
    font: "'Geist', system-ui",
    preview: (
      <div style={{ padding: '8px 10px', background: '#F8F8FC', border: '1px solid #E8E8F0' }}>
        <div style={{ fontFamily: "'Geist', system-ui", fontSize: 10, fontWeight: 600, color: '#0A0A14', marginBottom: 4 }}>
          Fresh Prints
        </div>
        <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 8, color: '#8A8A95' }}>
          Portfolio · About · Contact
        </div>
      </div>
    ),
  },
  digital: {
    bg: '#0A0A0F',
    accent: '#00C8FF',
    label: 'Digital',
    preview: (
      <div style={{ padding: '8px 10px', background: '#0A0A0F', border: '1px solid #00C8FF33' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#00C8FF', marginBottom: 4 }}>
          // FRESH PRINTS TERMINAL
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: '#606070' }}>
          ⬡ PORTFOLIO  ⬡ SKILLS  ⬡ LAB
        </div>
      </div>
    ),
  },
  retro: {
    bg: '#C0C0C0',
    accent: '#000080',
    label: 'Retro',
    preview: (
      <div style={{
        background: '#C0C0C0',
        boxShadow: 'inset 1px 1px 0 #FFF, inset -1px -1px 0 #404040, inset 2px 2px 0 #DFDFDF, inset -2px -2px 0 #808080',
        padding: 0,
      }}>
        <div style={{
          height: 16,
          background: 'linear-gradient(to right, #000080, #1084D0)',
          padding: '0 4px',
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{ width: 8, height: 8, background: '#FFFF00', marginRight: 4 }} />
          <span style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, color: '#FFF' }}>Fresh Prints</span>
        </div>
        <div style={{ padding: '6px 8px', background: '#FFFFCC' }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#000080', lineHeight: 1.8 }}>
            PORTFOLIO
          </div>
          <div style={{ fontFamily: 'Arial', fontSize: 8, color: '#000' }}>Kyle DeBord</div>
        </div>
      </div>
    ),
  },
}

function getThemeHome(id) {
  if (id === 'digital') return '/hub'
  if (id === 'standard') return '/home'
  if (id === 'retro') return '/home'
  return '/'
}

export default function UIPicker({ isOpen, onClose }) {
  const { themeId, mode, modePref, setTheme, setMode } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) return
    function handler(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const completeThemes = getCompleteThemes()
  const isRetro = themeId === 'retro'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
            }}
          />

          <motion.div
            key="picker-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 201,
              padding: '1rem',
              pointerEvents: 'none',
            }}
          >
            <div
              role="dialog"
              aria-label="Site experience picker"
              style={{
                width: 'min(520px, 100%)',
                maxHeight: 'calc(100vh - 2rem)',
                overflowY: 'auto',
                background: '#FFFFFF',
                borderRadius: '1rem',
                boxShadow: '0 24px 64px -12px rgba(0,0,0,0.35)',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '1.5rem 1.5rem 1rem',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '0.7rem',
                    color: '#8A8A95',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '0.25rem',
                  }}>
                    // EXPERIENCE
                  </div>
                  <div style={{ fontFamily: "'Geist', system-ui", fontWeight: 600, fontSize: '1rem', color: '#0A0A14' }}>
                    Choose your interface
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    background: 'none',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '0.5rem',
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5A5A6B',
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Theme options */}
              <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {completeThemes.map(id => {
                  const active = id === themeId
                  const preview = THEME_PREVIEWS[id]
                  return (
                    <button
                      key={id}
                      onClick={() => { setTheme(id); navigate(getThemeHome(id)); onClose() }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.625rem',
                        border: active ? '2px solid #1E3C64' : '1px solid rgba(0,0,0,0.08)',
                        background: active ? 'rgba(30,60,100,0.06)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {/* Radio dot */}
                      <div style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `2px solid ${active ? '#1E3C64' : 'rgba(0,0,0,0.2)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {active && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1E3C64' }} />
                        )}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "'Geist', system-ui",
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          color: '#0A0A14',
                          marginBottom: '0.125rem',
                        }}>
                          {getTheme(id).label}
                        </div>
                        <div style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: '0.7rem',
                          color: '#8A8A95',
                        }}>
                          {THEME_DESCS[id] || ''}
                        </div>
                      </div>

                      {/* Mini preview */}
                      {preview?.preview && (
                        <div style={{
                          width: 100,
                          flexShrink: 0,
                          overflow: 'hidden',
                          border: '1px solid rgba(0,0,0,0.08)',
                          borderRadius: 4,
                          fontSize: 0,
                        }}>
                          {preview.preview}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Mode picker — hidden for Retro */}
              {!isRetro && (
                <div style={{
                  padding: '0.75rem 1.5rem 1.5rem',
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                }}>
                  <div style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '0.7rem',
                    color: '#8A8A95',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '0.625rem',
                  }}>
                    // MODE
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { value: 'dark',  label: 'Dark' },
                      { value: 'light', label: 'Light' },
                      { value: 'auto',  label: 'Auto' },
                    ].map(opt => {
                      const active = modePref === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setMode(opt.value)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: active ? '2px solid #1E3C64' : '1px solid rgba(0,0,0,0.1)',
                            background: active ? 'rgba(30,60,100,0.08)' : 'transparent',
                            fontFamily: "'Geist', system-ui",
                            fontSize: '0.8125rem',
                            fontWeight: active ? 600 : 400,
                            color: active ? '#1E3C64' : '#5A5A6B',
                            cursor: 'pointer',
                            transition: 'all 150ms ease',
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

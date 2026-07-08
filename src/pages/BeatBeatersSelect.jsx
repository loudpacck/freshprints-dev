import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BEAT_BEATERS_CHARTS } from '@/data/beatBeatersCharts'

// ─── Beat Saber design tokens ──────────────────────────────────────────────────

const BB_BG       = '#05060f'
const BB_PANEL_BG = 'rgba(4, 8, 28, 0.88)'
const BB_BORDER   = 'rgba(0, 140, 255, 0.2)'
const BB_BORDER_A = 'rgba(0, 180, 255, 0.6)'
const BB_PRIMARY  = '#0088FF'
const BB_TEXT_SEC = 'rgba(255,255,255,0.55)'
const BB_SUCCESS  = '#00E676'
const BB_BEVEL    = 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)'
const BB_FONT     = "'Rajdhani', sans-serif"

const DIFF_CONFIG = {
  easy:   { label: 'EASY',   bg: '#00E676', text: '#04160b' },
  medium: { label: 'MEDIUM', bg: BB_PRIMARY, text: '#FFFFFF' },
  hard:   { label: 'HARD',   bg: '#FF1744', text: '#FFFFFF' },
}

function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BeatBeatersSelect() {
  const navigate = useNavigate()

  const [expandedId, setExpandedId] = useState(null)
  const [loading,    setLoading]    = useState(null) // { songId, difficulty }
  const [errors,     setErrors]     = useState({})   // { [songId]: message }

  function toggleCard(songId) {
    setExpandedId(prev => prev === songId ? null : songId)
    setErrors(prev => ({ ...prev, [songId]: null }))
  }

  async function selectDifficulty(song, difficulty) {
    setLoading({ songId: song.id, difficulty })
    setErrors(prev => ({ ...prev, [song.id]: null }))
    try {
      const res = await fetch(`/charts/${song.chartFile}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const chart = await res.json()
      navigate('/lab/beat-beaters/play', {
        state: {
          chartData:   chart,
          difficulty,
          audioFile:   song.audioFile,
          songTitle:   song.title,
          songArtist:  song.artist,
        },
      })
    } catch {
      setErrors(prev => ({
        ...prev,
        [song.id]: `CHART FILE NOT FOUND — check public/charts/${song.chartFile}`,
      }))
      setLoading(null)
    }
  }

  const noSongs = BEAT_BEATERS_CHARTS.length === 0

  return (
    <div style={{
      position: 'fixed', inset: 0, background: BB_BG, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: BB_FONT, color: '#FFFFFF',
      backgroundImage: `linear-gradient(rgba(0,140,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,140,255,0.03) 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
    }}>

      {/* CRT scanlines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px)',
      }} />
      {/* CRT vignette */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
      }} />

      {/* HUB button — bottom-left, song select only */}
      <Link
        to="/lab"
        style={{
          position: 'fixed', bottom: 24, left: 32, zIndex: 60,
          fontFamily: BB_FONT, fontSize: 14, fontWeight: 700,
          letterSpacing: '0.1em', color: BB_TEXT_SEC, textDecoration: 'none',
          padding: '10px 22px',
          background: BB_PANEL_BG,
          border: `1px solid ${BB_BORDER}`,
          clipPath: BB_BEVEL,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = BB_BORDER_A }}
        onMouseLeave={e => { e.currentTarget.style.color = BB_TEXT_SEC; e.currentTarget.style.borderColor = BB_BORDER }}
      >
        ← HUB
      </Link>

      {/* Top bar */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        padding: '24px 32px 0',
        zIndex: 10,
      }}>
        <div>
          <div style={{
            fontSize: 36, fontWeight: 700, letterSpacing: '0.2em', color: '#FFFFFF',
            textShadow: `0 0 20px ${BB_PRIMARY}, 0 0 60px rgba(0,136,255,0.3)`,
            lineHeight: 1,
          }}>
            BEAT BEATERS
          </div>
          <div style={{
            fontSize: 14, fontWeight: 500, color: BB_TEXT_SEC,
            letterSpacing: '0.3em', marginTop: 8,
          }}>
            SELECT TRACK
          </div>
        </div>
      </div>

      {/* Neon divider line */}
      <div style={{
        height: 1, background: BB_PRIMARY, margin: '18px 0 0',
        boxShadow: `0 0 8px ${BB_PRIMARY}`,
        opacity: 0.6, flexShrink: 0,
      }} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px' }}>

        {noSongs ? (
          /* Empty state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 400, textAlign: 'center',
          }}>
            <div style={{
              background: BB_PANEL_BG,
              border: `1px solid ${BB_BORDER}`,
              borderLeft: `3px solid ${BB_PRIMARY}`,
              padding: '40px 48px',
              clipPath: BB_BEVEL,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: BB_TEXT_SEC, letterSpacing: '0.15em', marginBottom: 12 }}>
                NO TRACKS YET
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: BB_TEXT_SEC, marginBottom: 32 }}>
                Create your first chart to start playing
              </div>
              <Link
                to="/lab/beat-beaters/editor"
                style={{
                  display: 'inline-block', padding: '12px 28px',
                  border: `1px solid ${BB_PRIMARY}`, color: BB_PRIMARY,
                  fontFamily: BB_FONT, fontSize: 15, fontWeight: 700,
                  letterSpacing: '0.1em', textDecoration: 'none',
                  clipPath: BB_BEVEL, transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = BB_PRIMARY; e.currentTarget.style.color = '#FFFFFF' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = BB_PRIMARY }}
              >
                OPEN CHART EDITOR →
              </Link>
            </div>
          </div>
        ) : (
          /* Song grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
            marginBottom: 40,
          }}>
            {BEAT_BEATERS_CHARTS.map(song => {
              const expanded  = expandedId === song.id
              const err       = errors[song.id]
              const isLoading = loading?.songId === song.id

              return (
                <div
                  key={song.id}
                  style={{
                    border: `1px solid ${expanded ? BB_BORDER_A : BB_BORDER}`,
                    borderLeft: expanded ? `4px solid ${song.accentColor}` : `3px solid ${song.accentColor}`,
                    background: expanded ? hexA(song.accentColor, 0.07) : BB_PANEL_BG,
                    padding: '20px 22px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    clipPath: BB_BEVEL,
                  }}
                  onClick={() => toggleCard(song.id)}
                  onMouseEnter={e => {
                    if (!expanded) {
                      e.currentTarget.style.borderColor = BB_BORDER_A
                      e.currentTarget.style.boxShadow = `inset 0 0 20px ${hexA(song.accentColor, 0.08)}`
                    }
                  }}
                  onMouseLeave={e => {
                    if (!expanded) {
                      e.currentTarget.style.borderColor = BB_BORDER
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  {/* Song title */}
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', marginBottom: 4, lineHeight: 1.2 }}>
                    {song.title}
                  </div>

                  {/* Artist */}
                  <div style={{ fontSize: 14, fontWeight: 500, color: BB_TEXT_SEC, marginBottom: 14 }}>
                    {song.artist}
                  </div>

                  {/* BPM badge + difficulty pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: '#FFFFFF',
                      background: 'rgba(255,255,255,0.08)',
                      padding: '3px 9px', letterSpacing: '0.05em',
                      clipPath: BB_BEVEL,
                    }}>
                      {song.bpm} BPM
                    </span>
                    {song.availableDifficulties.map(d => {
                      const cfg = DIFF_CONFIG[d] ?? { label: d.toUpperCase(), bg: '#888', text: '#fff' }
                      return (
                        <span key={d} style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                          padding: '3px 9px',
                          background: hexA(cfg.bg, 0.15),
                          color: cfg.bg,
                          border: `1px solid ${hexA(cfg.bg, 0.4)}`,
                          clipPath: BB_BEVEL,
                        }}>
                          {cfg.label}
                        </span>
                      )
                    })}
                  </div>

                  {/* Expanded difficulty selector */}
                  {expanded && (
                    <div
                      style={{ marginTop: 22 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div style={{
                        fontSize: 11, fontWeight: 600, color: BB_TEXT_SEC,
                        letterSpacing: '0.25em', marginBottom: 12,
                      }}>
                        SELECT DIFFICULTY
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {song.availableDifficulties.map(d => {
                          const cfg = DIFF_CONFIG[d] ?? { label: d.toUpperCase(), bg: '#888', text: '#fff' }
                          const isThisLoading = isLoading && loading.difficulty === d
                          return (
                            <button
                              key={d}
                              disabled={!!loading}
                              onClick={() => selectDifficulty(song, d)}
                              style={{
                                background:   isThisLoading ? hexA(cfg.bg, 0.6) : cfg.bg,
                                color:        isThisLoading ? 'rgba(255,255,255,0.7)' : cfg.text,
                                fontFamily:   BB_FONT,
                                fontSize:     15, fontWeight: 700,
                                letterSpacing: '0.08em',
                                padding:      '10px 26px',
                                border:       'none',
                                cursor:       loading ? 'not-allowed' : 'pointer',
                                opacity:      loading && !isThisLoading ? 0.5 : 1,
                                transition:   'filter 0.15s',
                                clipPath:     BB_BEVEL,
                                minWidth:     110,
                              }}
                              onMouseEnter={e => {
                                if (!loading) e.currentTarget.style.filter = `drop-shadow(0 0 8px ${cfg.bg})`
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.filter = 'none'
                              }}
                            >
                              {isThisLoading ? 'LOADING...' : cfg.label}
                            </button>
                          )
                        })}
                      </div>

                      {err && (
                        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: '#FF1744', letterSpacing: '0.03em' }}>
                          {err}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Create chart CTA */}
        <div style={{ textAlign: 'center', paddingTop: noSongs ? 0 : 8 }}>
          <Link
            to="/lab/beat-beaters/editor"
            style={{
              display: 'inline-block', padding: '11px 28px',
              border: `1px solid ${BB_PRIMARY}`,
              color: BB_PRIMARY,
              fontFamily: BB_FONT,
              fontSize: 15, fontWeight: 700, letterSpacing: '0.1em',
              textDecoration: 'none',
              clipPath: BB_BEVEL,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = BB_PRIMARY
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = BB_PRIMARY
            }}
          >
            CREATE A CHART →
          </Link>
        </div>

      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BEAT_BEATERS_CHARTS } from '@/data/beatBeatersCharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

const DIFF_COLORS = { easy: '#30D158', medium: '#FF9F0A', hard: '#FF3B3B' }

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
      position: 'fixed', inset: 0, background: '#0a0a0f', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"IBM Plex Mono", monospace', color: '#F0F0F8',
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

      {/* Top bar */}
      <div style={{
        height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(8,8,14,0.9)',
        zIndex: 10,
      }}>
        <div>
          <div style={{
            fontSize: 20, fontWeight: 700, letterSpacing: '0.15em', color: '#FFFFFF',
            textShadow: '0 0 16px #00C8FF, 0 0 40px rgba(0,200,255,0.35)',
          }}>
            BEAT BEATERS
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 4, marginTop: 2 }}>
            SELECT A TRACK
          </div>
        </div>
        <Link
          to="/lab"
          style={{
            fontSize: 10, color: 'rgba(255,255,255,0.35)', textDecoration: 'none',
            letterSpacing: 2, transition: 'color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
        >
          ← LAB
        </Link>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 40px' }}>

        {noSongs ? (
          /* Empty state */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.2)', letterSpacing: 4, marginBottom: 16 }}>
              NO TRACKS YET
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 32 }}>
              Create your first chart to start playing
            </div>
            <Link
              to="/lab/beat-beaters/editor"
              style={{
                display: 'inline-block', padding: '12px 28px',
                background: 'rgba(0,200,255,0.1)',
                border: '1px solid rgba(0,200,255,0.5)', color: '#00C8FF',
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 13, letterSpacing: 3, textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,200,255,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,200,255,0.1)' }}
            >
              OPEN CHART EDITOR →
            </Link>
          </div>
        ) : (
          /* Song grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}>
            {BEAT_BEATERS_CHARTS.map(song => {
              const expanded = expandedId === song.id
              const err      = errors[song.id]
              const isLoading = loading?.songId === song.id

              return (
                <div
                  key={song.id}
                  style={{
                    borderLeft: `3px solid ${song.accentColor}`,
                    border: `1px solid ${hexA(song.accentColor, expanded ? 1.0 : 0.5)}`,
                    borderLeft: `3px solid ${song.accentColor}`,
                    background: expanded ? hexA(song.accentColor, 0.06) : 'transparent',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onClick={() => toggleCard(song.id)}
                  onMouseEnter={e => {
                    if (!expanded) e.currentTarget.style.borderColor = song.accentColor
                    e.currentTarget.style.background = hexA(song.accentColor, expanded ? 0.06 : 0.04)
                  }}
                  onMouseLeave={e => {
                    if (!expanded) e.currentTarget.style.borderColor = hexA(song.accentColor, 0.5)
                    e.currentTarget.style.background = expanded ? hexA(song.accentColor, 0.06) : 'transparent'
                  }}
                >
                  {/* Song title */}
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
                    {song.title}
                  </div>

                  {/* Artist */}
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
                    {song.artist}
                  </div>

                  {/* BPM + difficulty pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 9, color: 'rgba(255,255,255,0.4)',
                      background: 'rgba(255,255,255,0.07)',
                      padding: '2px 7px', letterSpacing: 1,
                    }}>
                      {song.bpm} BPM
                    </span>
                    {song.availableDifficulties.map(d => (
                      <span key={d} style={{
                        fontSize: 9, letterSpacing: 1, padding: '2px 7px',
                        background: hexA(DIFF_COLORS[d] ?? '#888', 0.15),
                        color: DIFF_COLORS[d] ?? '#888',
                        border: `1px solid ${hexA(DIFF_COLORS[d] ?? '#888', 0.4)}`,
                      }}>
                        {d.toUpperCase()}
                      </span>
                    ))}
                  </div>

                  {/* Expanded difficulty selector */}
                  {expanded && (
                    <div
                      style={{ marginTop: 20 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, marginBottom: 10 }}>
                        SELECT DIFFICULTY
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {song.availableDifficulties.map(d => {
                          const dc       = DIFF_COLORS[d] ?? '#888'
                          const isThisLoading = isLoading && loading.difficulty === d
                          return (
                            <button
                              key={d}
                              disabled={!!loading}
                              onClick={() => selectDifficulty(song, d)}
                              style={{
                                background:   hexA(dc, 0.12),
                                border:       `1px solid ${dc}`,
                                color:        dc,
                                fontFamily:   '"IBM Plex Mono", monospace',
                                fontSize:     13, fontWeight: 700,
                                letterSpacing: 3, padding: '10px 22px',
                                cursor:       loading ? 'not-allowed' : 'pointer',
                                opacity:      loading && !isThisLoading ? 0.5 : 1,
                                transition:   'all 0.15s',
                                boxShadow:    isThisLoading ? `0 0 20px ${hexA(dc, 0.4)}` : 'none',
                              }}
                              onMouseEnter={e => {
                                if (!loading) e.currentTarget.style.background = hexA(dc, 0.25)
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = hexA(dc, 0.12)
                              }}
                            >
                              {isThisLoading ? 'LOADING...' : d.toUpperCase()}
                            </button>
                          )
                        })}
                      </div>

                      {/* Error message */}
                      {err && (
                        <div style={{ marginTop: 10, fontSize: 10, color: '#FF3B3B', letterSpacing: 1 }}>
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
              display: 'inline-block', padding: '10px 24px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.45)',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 11, letterSpacing: 3, textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
              e.currentTarget.style.color       = 'rgba(255,255,255,0.8)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.color       = 'rgba(255,255,255,0.45)'
            }}
          >
            CREATE A CHART →
          </Link>
        </div>

      </div>
    </div>
  )
}

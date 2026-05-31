import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { soundManager } from '@/sound/SoundManager'

const BIOS_LINES = [
  'FreshPrints Industries BIOS v2.5.7',
  'Copyright (c) 1998-2026 Kyle DeBord',
  'Initializing portfolio modules...',
  'Loading projects.dat         OK',
  'Loading skills.dat           OK',
  'Loading services.dat         OK',
  'Press any key to continue, or wait...',
]

export default function RetroBootSequence({ onComplete }) {
  const [phase, setPhase] = useState('bios')    // 'bios' | 'splash' | 'done'
  const [visibleLines, setVisibleLines] = useState([])
  const [progress, setProgress] = useState(0)

  const finish = useCallback(() => {
    setPhase('done')
    setTimeout(onComplete, 400)
  }, [onComplete])

  // Skip on keypress or click
  useEffect(() => {
    const skip = () => finish()
    window.addEventListener('keydown', skip, { once: true })
    window.addEventListener('click', skip, { once: true })
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('click', skip)
    }
  }, [finish])

  // BIOS phase: reveal lines one-by-one
  useEffect(() => {
    if (phase !== 'bios') return
    let i = 0
    const interval = setInterval(() => {
      i++
      setVisibleLines(BIOS_LINES.slice(0, i))
      if (i >= BIOS_LINES.length) {
        clearInterval(interval)
        setTimeout(() => setPhase('splash'), 300)
      }
    }, 110)
    return () => clearInterval(interval)
  }, [phase])

  // Splash phase: progress bar + boot chime
  useEffect(() => {
    if (phase !== 'splash') return
    // Play boot sound after a short delay (needs user gesture; AudioContext may be suspended)
    const audioTimer = setTimeout(() => soundManager.play('boot'), 100)

    let p = 0
    const interval = setInterval(() => {
      p += 4
      setProgress(Math.min(p, 100))
      if (p >= 100) {
        clearInterval(interval)
        setTimeout(() => finish(), 400)
      }
    }, 60)

    return () => {
      clearInterval(interval)
      clearTimeout(audioTimer)
    }
  }, [phase, finish])

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={finish}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {/* BIOS phase */}
          {phase === 'bios' && (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#000000',
              padding: '40px 48px',
              boxSizing: 'border-box',
            }}>
              {visibleLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.05 }}
                  style={{
                    fontFamily: "'VT323', 'Courier New', monospace",
                    fontSize: 18,
                    color: '#C0C0C0',
                    lineHeight: 1.7,
                    whiteSpace: 'pre',
                  }}
                >
                  {line}
                </motion.div>
              ))}
              {/* Blinking cursor */}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                style={{
                  display: 'inline-block',
                  width: 9,
                  height: 18,
                  background: '#C0C0C0',
                  verticalAlign: 'bottom',
                  marginLeft: 2,
                }}
              />
            </div>
          )}

          {/* Splash phase */}
          {phase === 'splash' && (
            <motion.div
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                width: '100%',
                height: '100%',
                background: '#008080',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
              }}
            >
              {/* Logo window */}
              <div style={{
                background: '#C0C0C0',
                boxShadow: '4px 4px 0 rgba(0,0,0,0.4), inset 2px 2px 0 #FFFFFF, inset -2px -2px 0 #808080',
                padding: 0,
                width: 340,
              }}>
                {/* Title bar */}
                <div style={{
                  height: 22,
                  background: 'linear-gradient(to right, #000080, #1084D0)',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 6,
                }}>
                  <div style={{ width: 12, height: 12, background: '#FFFF00', border: '1px solid rgba(255,255,255,0.3)', marginRight: 6 }} />
                  <span style={{ fontFamily: 'var(--font-body, Arial)', fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                    Fresh Prints
                  </span>
                </div>
                {/* Content */}
                <div style={{
                  background: '#FFFFCC',
                  padding: '24px 32px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 14,
                    color: '#000080',
                    lineHeight: 1.8,
                    marginBottom: 12,
                  }}>
                    FRESH PRINTS
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body, Arial)',
                    fontSize: 12,
                    color: '#000000',
                    marginBottom: 20,
                  }}>
                    Starting Fresh Prints...
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: 20,
                    background: '#FFFFFF',
                    boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #FFFFFF',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'repeating-linear-gradient(90deg, #000080 0px, #000080 8px, #1084D0 8px, #1084D0 16px)',
                      transition: 'width 60ms linear',
                    }} />
                  </div>
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--font-body, Arial)',
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)',
              }}>
                Click anywhere or press any key to skip
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

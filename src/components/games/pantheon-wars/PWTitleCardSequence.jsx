import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { musicManager } from '@/sound/MusicManager'

// Title card plays on every shell mount (i.e. every entry into game routes from outside).
// The <video> is muted so browser autoplay works; audio comes from MusicManager (intro.mp3).
// Intro song starts when the video starts and plays through to its natural end,
// continuing after the title card fades out. AmbienceManager auto-starts when intro ends
// via the fp-music-playback-change event chain — no coordination needed here.
const VIDEO_SRC = '/videos/pantheon_wars/titlecard.mp4'

export default function PWTitleCardSequence({ onComplete }) {
  const videoRef = useRef(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Start intro music the moment the video starts
    musicManager.play('/sounds/pantheon_wars/intro.mp3', { volume: 0.3 })
    // Attempt to play video (it's muted, so autoplay is unrestricted)
    videoRef.current?.play().catch(() => {})
  }, [])

  function handleVideoEnded() {
    // Fade out the overlay; intro song continues independently
    setVisible(false)
  }

  function handleAnimationComplete() {
    if (!visible) {
      onComplete()
    }
  }

  // Allow skipping by clicking anywhere or pressing any key
  function handleSkip() {
    setVisible(false)
  }

  useEffect(() => {
    window.addEventListener('keydown', handleSkip, { once: true })
    return () => window.removeEventListener('keydown', handleSkip)
  }, [])

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {visible && (
        <motion.div
          key="pw-title-card"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          onClick={handleSkip}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            muted
            playsInline
            onEnded={handleVideoEnded}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

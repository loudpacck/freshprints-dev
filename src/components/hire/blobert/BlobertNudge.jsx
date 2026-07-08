import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { NUDGE_AUTOHIDE_MS } from './blobertBehavior'

// A single proactive speech bubble anchored just above the collapsed blob. Theme-
// token styled, small tail pointing down toward Blobert, inline dismiss ✕. Tapping
// the text opens the chat (onOpen); the ✕ silences all nudges for the session
// (onDismiss). Auto-hides after 8s untouched (onExpire — no silence). Reduced
// motion: appears/disappears with no animation, content still shows.
export default function BlobertNudge({
  skin, reduced, text, isMobile, right, bottom, onOpen, onDismiss, onExpire,
}) {
  const c = skin.colors
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire

  useEffect(() => {
    const t = setTimeout(() => expireRef.current && expireRef.current(), NUDGE_AUTOHIDE_MS)
    return () => clearTimeout(t)
  }, [text])

  const maxW = isMobile ? 210 : 260

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10, scale: 0.9 }}
      animate={reduced ? {} : { opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? {} : { opacity: 0, y: 8, scale: 0.92 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        right,
        bottom,
        zIndex: 902,
        maxWidth: maxW,
        transformOrigin: 'bottom right',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          background: c.panelElevated,
          color: c.text,
          border: `1px solid ${c.border}`,
          borderRadius: skin.key === 'retro' ? 0 : 14,
          padding: '10px 10px 10px 12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.32)',
          fontFamily: skin.fonts.body,
        }}
      >
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open chat with Blobert"
          style={{
            flex: 1,
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            color: 'inherit',
            fontFamily: 'inherit',
            fontSize: isMobile ? 12.5 : 'var(--text-sm, 13.5px)',
            lineHeight: 1.4,
          }}
        >
          {text}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss and silence Blobert's tips"
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            color: c.textMuted,
            cursor: 'pointer',
            fontSize: 15,
            lineHeight: 1,
            padding: '0 2px',
            marginTop: -1,
          }}
        >
          ×
        </button>

        {/* Tail — points down toward the blob (bottom-right). */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -6,
            right: 22,
            width: 12,
            height: 12,
            background: c.panelElevated,
            borderRight: `1px solid ${c.border}`,
            borderBottom: `1px solid ${c.border}`,
            transform: 'rotate(45deg)',
          }}
        />
      </div>
    </motion.div>
  )
}

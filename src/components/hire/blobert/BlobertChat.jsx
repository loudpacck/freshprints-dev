import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import BlobertBlob from './BlobertBlob'

// Client-side word-by-word typing reveal (~25–40ms/word with jitter). Runs only
// for Blobert bubbles that haven't been revealed yet; reduced motion shows the
// full text instantly. `active` stays true until the reveal finishes so a
// re-render (e.g. a new pending bubble) can't cut the animation short.
function useTypedText(text, active, onDone) {
  const [shown, setShown] = useState(active ? '' : text)
  useEffect(() => {
    if (!active) { setShown(text); return undefined }
    const words = text.split(' ')
    let i = 0
    let timer
    setShown('')
    const step = () => {
      i += 1
      setShown(words.slice(0, i).join(' '))
      if (i < words.length) {
        timer = setTimeout(step, 25 + Math.random() * 15)
      } else if (onDone) {
        onDone()
      }
    }
    timer = setTimeout(step, 70)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active])
  return shown
}

function ThinkingDots({ color }) {
  return (
    <span className="blobert-dots" aria-label="Blobert is thinking" style={{ display: 'inline-flex', gap: 4, alignItems: 'center', height: 14 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: color, opacity: 0.5, animation: `blobert-dot 1.2s ${i * 0.18}s infinite ease-in-out` }} />
      ))}
    </span>
  )
}

function MessageBubble({ msg, skin, reduced, animate, onRevealed, onChip, onLeadDraft }) {
  const c = skin.colors
  const isUser = msg.role === 'user'
  const shownText = useTypedText(msg.text || '', animate && !isUser && !msg.pending, onRevealed)

  const bubbleStyle = {
    maxWidth: '84%',
    padding: 'var(--space-3, 10px) var(--space-4, 14px)',
    borderRadius: 14,
    fontFamily: skin.fonts.body,
    fontSize: 'var(--text-sm, 14px)',
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    background: isUser ? c.accent : c.panelElevated,
    color: isUser ? c.onAccent : c.text,
    border: isUser ? 'none' : `1px solid ${c.border}`,
    borderBottomRightRadius: isUser ? 4 : 14,
    borderBottomLeftRadius: isUser ? 14 : 4,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 6 }}>
      <div style={bubbleStyle}>
        {msg.pending ? <ThinkingDots color={c.text} /> : (isUser ? msg.text : shownText)}
      </div>
      {msg.chips && msg.chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {msg.chips.map((chip, i) => (
            <button
              key={`${chip.label}-${i}`}
              onClick={() => (chip.action === 'lead' ? onLeadDraft() : onChip(chip.label))}
              style={{
                fontFamily: skin.fonts.mono,
                fontSize: 'var(--text-xs, 12px)',
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${c.accent}`,
                background: 'transparent',
                color: c.accent,
                cursor: 'pointer',
                lineHeight: 1.2,
              }}
            >
              {chip.action === 'lead' ? `✎ ${chip.label}` : chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BlobertChat({
  skin, reduced, blobState, messages, inputDisabled, gaze = null,
  isMobile, kbInset, bottomExtra = 0, autoFocus = false, revealedRef, onSend, onLeadDraft, onClose,
}) {
  const c = skin.colors
  const listRef = useRef(null)
  const taRef = useRef(null)
  const [value, setValue] = useState('')

  // Auto-scroll to the latest message / typing growth.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  // Pre-focus the input when opened from a nudge (desktop only — avoids yanking
  // up the mobile keyboard unprompted).
  useEffect(() => {
    if (!autoFocus) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    taRef.current && taRef.current.focus()
  }, [autoFocus])

  function autosize() {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 72)}px`
  }

  function submit() {
    const v = value.trim()
    if (!v || inputDisabled) return
    setValue('')
    if (taRef.current) taRef.current.style.height = 'auto'
    onSend(v)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const containerStyle = isMobile
    ? {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: kbInset + bottomExtra,
        maxHeight: `calc(92dvh - ${kbInset + bottomExtra}px)`,
        height: 'auto',
        borderRadius: '16px 16px 0 0',
      }
    : {
        position: 'fixed',
        right: 'max(16px, env(safe-area-inset-right))',
        bottom: `calc(max(16px, env(safe-area-inset-bottom)) + ${bottomExtra}px)`,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: `min(70dvh, 560px)`,
        borderRadius: 16,
      }

  return (
    <motion.div
      role="dialog"
      aria-label="Chat with Blobert"
      initial={reduced ? false : { opacity: 0, scale: 0.85, y: 20 }}
      animate={reduced ? {} : { opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? {} : { opacity: 0, scale: 0.85, y: 20 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        ...containerStyle,
        zIndex: 901,
        display: 'flex',
        flexDirection: 'column',
        transformOrigin: 'bottom right',
        background: c.panel,
        border: `1px solid ${c.border}`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3, 10px)',
        padding: '10px 12px', borderBottom: `1px solid ${c.border}`, background: c.panelElevated, flexShrink: 0,
      }}>
        <BlobertBlob skin={skin} reduced={reduced} state={blobState} size={38} gaze={gaze} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: skin.fonts.display, fontSize: 'var(--text-base, 16px)', color: c.text, lineHeight: 1.1, letterSpacing: 'var(--tracking-wide, 0.02em)' }}>
            Blobert
          </div>
          <div style={{ fontFamily: skin.fonts.mono, fontSize: 10, color: c.textMuted, lineHeight: 1.3 }}>
            Chats are logged to make Blobert smarter.
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Dismiss Blobert"
          style={{ background: 'transparent', border: 'none', color: c.textMuted, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-4, 14px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            skin={skin}
            reduced={reduced}
            animate={!revealedRef.current.has(msg.id)}
            onRevealed={() => revealedRef.current.add(msg.id)}
            onChip={onSend}
            onLeadDraft={onLeadDraft}
          />
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: 'var(--space-3, 10px)', borderTop: `1px solid ${c.border}`, background: c.panelElevated, flexShrink: 0 }}>
        <textarea
          ref={taRef}
          value={value}
          onChange={e => { setValue(e.target.value.slice(0, 500)); autosize() }}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={500}
          disabled={inputDisabled}
          placeholder={inputDisabled ? 'Blobert is thinking…' : 'Ask about Kyle…'}
          style={{
            flex: 1, resize: 'none', maxHeight: 72, minHeight: 20, overflowY: 'auto',
            fontFamily: skin.fonts.body, fontSize: 'var(--text-sm, 14px)', lineHeight: 1.4,
            color: c.text, background: c.base, border: `1px solid ${c.border}`, borderRadius: 10,
            padding: '8px 10px', outline: 'none',
          }}
        />
        <button
          onClick={submit}
          disabled={inputDisabled || !value.trim()}
          aria-label="Send message"
          style={{
            flexShrink: 0, width: 38, height: 38, borderRadius: 10, border: 'none',
            background: c.accent, color: c.onAccent, cursor: inputDisabled || !value.trim() ? 'default' : 'pointer',
            opacity: inputDisabled || !value.trim() ? 0.5 : 1, fontSize: 16, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ↑
        </button>
      </div>
    </motion.div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '@/themes/useTheme'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useHireTone, toneFromCopyMode } from '@/components/hire/HireToneContext'
import BlobertBlob from './BlobertBlob'
import BlobertChat from './BlobertChat'
import { getSkin, apiThemeFor } from './blobertSkins'
import {
  greetingLine, STARTER_CHIPS, FAQ_CHIPS, napLine, wakeLine, isDismissal,
  themeReactionLine, toneAckLine, LIMIT_INTRO, networkFallbackLine,
  LEAD_CHIP_LABEL, LEAD_DRAFT_INSTRUCTION, leadCopiedLine, leadFailIntroLine,
} from './blobertLines'

const HIGHLIGHT_SLUGS = ['pantheon-wars', 'predictinator', 'lexis-nails', 'plutus']
const SESSION_KEY = 'blobert-session'
const NAP_KEY = 'blobert-napping'

let msgSeq = 0
function nextId() { msgSeq += 1; return `m${msgSeq}` }

// Extract whitelisted action tokens, strip them from the visible text, and
// report which ones fired (at most one highlight — the first).
function parseTokens(reply) {
  let highlight = null
  let openContact = false
  let lead = false
  const text = String(reply || '').replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const [rawCmd, rawArg] = String(inner).split(':')
    const cmd = (rawCmd || '').trim().toLowerCase()
    const arg = (rawArg || '').trim().toLowerCase()
    if (cmd === 'highlight' && HIGHLIGHT_SLUGS.includes(arg)) {
      if (!highlight) highlight = arg
    } else if (cmd === 'open' && arg === 'contact') {
      openContact = true
    } else if (cmd === 'lead') {
      lead = true
    }
    return ''
  }).replace(/\s+/g, ' ').trim()
  return { text, highlight, openContact, lead }
}

function pulseElement(id, reduced) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
  el.classList.remove('blobert-pulse')
  // Force reflow so re-adding the class restarts the animation.
  void el.offsetWidth
  el.classList.add('blobert-pulse')
  window.setTimeout(() => el.classList.remove('blobert-pulse'), 1700)
}

export default function BlobertWidget() {
  const { themeId } = useTheme()
  const reduced = useReducedMotion()
  const { copyMode } = useHireTone()
  const tone = toneFromCopyMode(copyMode)
  const skin = getSkin(themeId)

  const [mode, setMode] = useState(() => (sessionStorage.getItem(NAP_KEY) === '1' ? 'napping' : 'bubble'))
  const [messages, setMessages] = useState([])
  const [pending, setPending] = useState(false)

  const msgsRef = useRef([])
  const greetedRef = useRef(false)
  const openedRef = useRef(false)
  const limitWarnedRef = useRef(false)
  const leadInFlightRef = useRef(false)
  const firstThemeRef = useRef(true)
  const firstToneRef = useRef(true)
  const revealedRef = useRef(new Set()) // typed-reveal memory; persists across panel open/close
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const [kbInset, setKbInset] = useState(0)

  useEffect(() => { msgsRef.current = messages }, [messages])

  // Stable per-session id.
  const sessionIdRef = useRef(null)
  if (!sessionIdRef.current) {
    let sid = sessionStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = (crypto.randomUUID && crypto.randomUUID()) || `s-${Date.now()}-${Math.random().toString(16).slice(2)}`
      sessionStorage.setItem(SESSION_KEY, sid)
    }
    sessionIdRef.current = sid
  }

  const addMsg = useCallback((msg) => {
    const id = nextId()
    setMessages(prev => [...prev, { id, ...msg }])
    return id
  }, [])

  // --- Responsive + mobile keyboard handling --------------------------------
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return undefined
    const onVv = () => {
      const inset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop))
      setKbInset(inset > 80 ? inset : 0) // ignore small chrome shifts; keyboard is large
    }
    vv.addEventListener('resize', onVv)
    vv.addEventListener('scroll', onVv)
    onVv()
    return () => { vv.removeEventListener('resize', onVv); vv.removeEventListener('scroll', onVv) }
  }, [])

  // --- Theme reaction line ($0, not sent to the API) -------------------------
  useEffect(() => {
    if (firstThemeRef.current) { firstThemeRef.current = false; return }
    if (!openedRef.current || mode === 'napping') return
    addMsg({ role: 'blobert', text: themeReactionLine(apiThemeFor(themeId)), apiHistory: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId])

  // --- Tone-flip acknowledgment ($0, not sent to the API) --------------------
  useEffect(() => {
    if (firstToneRef.current) { firstToneRef.current = false; return }
    if (!openedRef.current || mode === 'napping') return
    addMsg({ role: 'blobert', text: toneAckLine(tone), apiHistory: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tone])

  // --- Open / wake / dismiss transitions ------------------------------------
  function openPanel() {
    const wasNapping = mode === 'napping'
    setMode('open')
    sessionStorage.removeItem(NAP_KEY)
    openedRef.current = true
    if (wasNapping) {
      addMsg({ role: 'blobert', text: wakeLine(), apiHistory: false })
    } else if (!greetedRef.current) {
      greetedRef.current = true
      addMsg({
        role: 'blobert',
        text: greetingLine(apiThemeFor(themeId), tone),
        apiHistory: false,
        chips: STARTER_CHIPS.map(label => ({ label, action: 'send' })),
      })
    }
  }

  function dismiss() {
    setMode('napping')
    sessionStorage.setItem(NAP_KEY, '1')
  }

  // --- API call -------------------------------------------------------------
  const callBrain = useCallback(async (userText) => {
    const history = msgsRef.current
      .filter(m => m.apiHistory)
      .slice(-6)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'blobert', content: m.text }))
    const resp = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'hire_buddy',
        message: userText,
        history,
        theme: apiThemeFor(themeId),
        tone,
        sessionId: sessionIdRef.current,
      }),
    })
    return resp.json()
  }, [themeId, tone])

  // --- Send a normal visitor message ----------------------------------------
  async function sendMessage(text) {
    const trimmed = String(text).trim()
    if (!trimmed || pending) return

    // Client-side dismissal → nap, no API call.
    if (isDismissal(trimmed)) {
      addMsg({ role: 'user', text: trimmed, apiHistory: false })
      addMsg({ role: 'blobert', text: napLine(), apiHistory: false })
      window.setTimeout(dismiss, 1400)
      return
    }

    addMsg({ role: 'user', text: trimmed, apiHistory: true })
    const pendingId = addMsg({ role: 'blobert', text: '', pending: true, apiHistory: false })
    setPending(true)

    let data
    try {
      data = await callBrain(trimmed)
    } catch {
      replacePending(pendingId, { role: 'blobert', text: networkFallbackLine(), apiHistory: false })
      setPending(false)
      return
    }
    handleResponse(pendingId, data)
    setPending(false)
  }

  function replacePending(pendingId, msg) {
    setMessages(prev => prev.map(m => (m.id === pendingId ? { id: pendingId, ...msg } : m)))
  }

  function handleResponse(pendingId, data) {
    const source = data?.source

    if (source === 'ratelimited' || source === 'capped') {
      const chips = FAQ_CHIPS.map(label => ({ label, action: 'send' }))
      // Only spell out the limit apology once per streak; afterwards just serve chips.
      const text = limitWarnedRef.current ? 'Still running on memory — try one of these:' : LIMIT_INTRO
      limitWarnedRef.current = true
      replacePending(pendingId, { role: 'blobert', text, chips, apiHistory: false })
      return
    }

    // A successful AI/cache/fuzzy answer resets the limit warning.
    limitWarnedRef.current = false

    if (source === 'error') {
      replacePending(pendingId, { role: 'blobert', text: data.reply || networkFallbackLine(), apiHistory: false })
      return
    }

    // cache | fuzzy | ai
    const { text, highlight, openContact, lead } = parseTokens(data?.reply || '')
    const isRealAnswer = source === 'cache' || source === 'fuzzy' || source === 'ai'
    replacePending(pendingId, {
      role: 'blobert',
      text: text || '…',
      apiHistory: isRealAnswer,
      chips: lead ? [{ label: LEAD_CHIP_LABEL, action: 'lead' }] : undefined,
    })

    if (highlight) pulseElement(`blobert-card-${highlight}`, reduced)
    else if (openContact) pulseElement('blobert-contact-cta', reduced)
  }

  // --- Lead draft: hidden instruction → clipboard prefill -------------------
  async function runLeadDraft() {
    if (pending || leadInFlightRef.current) return
    leadInFlightRef.current = true
    // The instruction goes to the brain as the visitor's latest turn but is not
    // shown as a user bubble.
    addMsg({ role: 'user', text: LEAD_DRAFT_INSTRUCTION, apiHistory: true, hidden: true })
    const pendingId = addMsg({ role: 'blobert', text: '', pending: true, apiHistory: false })
    setPending(true)

    let data
    try {
      data = await callBrain(LEAD_DRAFT_INSTRUCTION)
    } catch {
      replacePending(pendingId, { role: 'blobert', text: networkFallbackLine(), apiHistory: false })
      setPending(false)
      leadInFlightRef.current = false
      return
    }

    const draft = parseTokens(data?.reply || '').text
    if (!draft || (data?.source !== 'ai' && data?.source !== 'cache' && data?.source !== 'fuzzy')) {
      replacePending(pendingId, { role: 'blobert', text: data?.reply || networkFallbackLine(), apiHistory: false })
      setPending(false)
      leadInFlightRef.current = false
      return
    }

    let copied = false
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(draft)
        copied = true
      }
    } catch { copied = false }

    if (copied) {
      replacePending(pendingId, { role: 'blobert', text: leadCopiedLine(), apiHistory: false })
    } else {
      replacePending(pendingId, { role: 'blobert', text: `${leadFailIntroLine()}\n\n${draft}`, apiHistory: false })
    }
    pulseElement('blobert-contact-cta', reduced)
    setPending(false)
    leadInFlightRef.current = false
  }

  const blobState = pending ? 'thinking' : (mode === 'napping' ? 'napping' : 'idle')
  const c = skin.colors

  // Avoid colliding with other bottom-right chrome: Digital's SoundToggle
  // (bottom-right) and Retro's sticky 28px status bar.
  const bottomExtra = themeId === 'retro' ? 30 : 0
  const bubbleRight = themeId === 'digital'
    ? 'calc(88px + env(safe-area-inset-right, 0px))'
    : 'max(16px, env(safe-area-inset-right))'
  const bubbleBottom = `calc(max(16px, env(safe-area-inset-bottom)) + ${bottomExtra}px)`

  return (
    <>
      <AnimatePresence>
        {mode === 'open' && (
          <BlobertChat
            key="panel"
            skin={skin}
            reduced={reduced}
            blobState={blobState}
            messages={messages}
            inputDisabled={pending}
            isMobile={isMobile}
            kbInset={kbInset}
            bottomExtra={bottomExtra}
            revealedRef={revealedRef}
            onSend={sendMessage}
            onLeadDraft={runLeadDraft}
            onClose={dismiss}
          />
        )}
      </AnimatePresence>

      {/* Bubble affordance — hidden while the panel is open. */}
      {mode !== 'open' && (
        <button
          onClick={openPanel}
          aria-label={mode === 'napping' ? 'Wake Blobert' : 'Chat with Blobert'}
          style={{
            position: 'fixed',
            right: bubbleRight,
            bottom: bubbleBottom,
            zIndex: 900,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: `drop-shadow(${skin.bubbleShadow === 'none' ? '0 6px 14px rgba(0,0,0,0.3)' : '0 6px 14px rgba(0,0,0,0.3)'})`,
          }}
        >
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <BlobertBlob skin={skin} reduced={reduced} state={blobState} size={72} />

            {/* "z z z" while napping (drifts only when motion is allowed). */}
            {mode === 'napping' && !reduced && (
              <span aria-hidden="true" style={{ position: 'absolute', top: -6, right: -10, fontFamily: skin.fonts.mono, color: c.textMuted, fontSize: 12, lineHeight: 1 }}>
                {['z', 'z', 'z'].map((z, i) => (
                  <span key={i} className="blobert-z" style={{ display: 'inline-block', animationDelay: `${i * 0.4}s`, fontSize: 10 + i * 2 }}>{z}</span>
                ))}
              </span>
            )}

            {/* Chat affordance dot — only in the awake bubble state. */}
            {mode === 'bubble' && (
              <span aria-hidden="true" style={{
                position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%',
                background: c.accent, color: c.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, border: `2px solid ${c.base}`,
              }}>
                💬
              </span>
            )}
          </span>
        </button>
      )}

      {/* Global styles: body motion, pulse ring on highlighted cards, dots, zzz. */}
      <style>{`
        .blobert-body-breathe { animation: blobert-breathe 6s ease-in-out infinite; }
        @keyframes blobert-breathe { 0%,100%{ transform: scale(1); } 50%{ transform: scale(1.02); } }
        .blobert-body-jitter { animation: blobert-jitter 5s steps(1) infinite; }
        @keyframes blobert-jitter { 0%,96%,100%{ transform: translate(0,0); } 97%{ transform: translate(1px,-1px); } 98.5%{ transform: translate(-1px,0); } }
        .blobert-body-morph { animation: blobert-morph 8s ease-in-out infinite; }
        @keyframes blobert-morph {
          0%,100% { border-radius: 42% 58% 55% 45% / 48% 42% 58% 52%; }
          33% { border-radius: 58% 42% 45% 55% / 55% 48% 52% 45%; }
          66% { border-radius: 48% 52% 60% 40% / 42% 58% 45% 55%; }
        }
        @keyframes blobert-dot { 0%,100%{ transform: translateY(0); opacity: 0.4; } 50%{ transform: translateY(-4px); opacity: 1; } }
        .blobert-z { animation: blobert-z 2.4s ease-in-out infinite; }
        @keyframes blobert-z { 0%{ transform: translateY(0); opacity: 0; } 25%{ opacity: 1; } 100%{ transform: translateY(-10px); opacity: 0; } }

        .blobert-pulse {
          animation: blobert-pulse-kf 1.6s ease-out 1;
          border-radius: var(--radius-lg, 12px);
        }
        @keyframes blobert-pulse-kf {
          0%   { box-shadow: 0 0 0 0 var(--color-accent-primary), 0 0 0 0 transparent; }
          18%  { box-shadow: 0 0 0 3px var(--color-accent-primary), 0 0 28px 6px var(--color-accent-primary-glow, var(--color-accent-primary)); }
          100% { box-shadow: 0 0 0 0 transparent, 0 0 0 0 transparent; }
        }
        @media (prefers-reduced-motion: reduce) {
          .blobert-body-breathe, .blobert-body-jitter, .blobert-body-morph, .blobert-z, .blobert-dots span { animation: none !important; }
          .blobert-pulse { animation: none !important; box-shadow: 0 0 0 3px var(--color-accent-primary); }
        }
      `}</style>
    </>
  )
}

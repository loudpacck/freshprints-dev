import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/themes/useTheme'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useHireTone, toneFromCopyMode } from '@/components/hire/HireToneContext'
import BlobertBlob from './BlobertBlob'
import BlobertChat from './BlobertChat'
import BlobertNudge from './BlobertNudge'
import { getSkin, apiThemeFor } from './blobertSkins'
import {
  routeGreetingLine, routeTransitionLine, STARTER_CHIPS, FAQ_CHIPS, napLine, wakeLine, sheepishWakeLine, isDismissal,
  themeReactionLine, toneAckLine, LIMIT_INTRO, networkFallbackLine,
  LEAD_CHIP_LABEL, LEAD_DRAFT_INSTRUCTION, leadCopiedLine, leadFailIntroLine,
  LEAD_STORAGE_KEY, leadDeliveredLine,
  nudgeDwellLine, nudgeToneLine, nudgeThemeLine, projectFactLine, hasProjectFacts, nudgeChipFor,
} from './blobertLines'
import {
  IDLE_MIN_MS, IDLE_MAX_MS, YAWN_IDLE_MS, pickIdleAct, randomGlanceGaze,
  pickNapPose, poseTransform, pickSnore,
  NUDGE_SESSION_CAP, NUDGE_MIN_GAP_MS, NUDGE_PAGE_MIN_MS, NUDGE_INTERACTION_COOLDOWN_MS,
  NUDGE_DWELL_MS, NUDGE_TONE_MS, NUDGE_THEME_MS, NUDGE_FACT_DWELL_MS, isInputFocused,
} from './blobertBehavior'

const HIGHLIGHT_SLUGS = ['pantheon-wars', 'predictinator', 'lexis-nails', 'plutus']
const SESSION_KEY = 'blobert-session'
const NAP_KEY = 'blobert-napping'          // '1' = manual dismissal, 'self' = self-nap
const TRANSITION_KEY = 'blobert-transition-said' // once-per-session route-change line
const NUDGE_COUNT_KEY = 'blobert-nudge-count'
const NUDGE_SILENCE_KEY = 'blobert-nudge-silenced'
const NUDGE_FIRED_KEY = 'blobert-nudge-fired'

// Poll (rAF, up to `timeoutMs`) for an element that may not exist yet — e.g. a
// /hire card after we navigate there from another page. Abandons silently.
function pollForElement(id, timeoutMs, onFound) {
  const start = performance.now()
  const tick = () => {
    const el = document.getElementById(id)
    if (el) { onFound(el); return }
    if (performance.now() - start > timeoutMs) return
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

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

// Direction (normalized -1..1) from Blobert's bottom-right anchor toward an element.
function gazeTowardEl(el) {
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const ax = window.innerWidth - 70
  const ay = window.innerHeight - 70
  const dx = cx - ax
  const dy = cy - ay
  const d = Math.hypot(dx, dy) || 1
  const clamp = (v) => Math.max(-1, Math.min(1, v))
  return { x: clamp((dx / d) * 0.95), y: clamp((dy / d) * 0.95) }
}

// --- Session-scoped nudge bookkeeping ----------------------------------------
function nudgeCount() { return Number(sessionStorage.getItem(NUDGE_COUNT_KEY) || 0) }
function nudgeSilenced() { return sessionStorage.getItem(NUDGE_SILENCE_KEY) === '1' }
function firedSet() {
  try { return new Set(JSON.parse(sessionStorage.getItem(NUDGE_FIRED_KEY) || '[]')) } catch { return new Set() }
}
function markNudgeFired(type) {
  const s = firedSet()
  s.add(type)
  sessionStorage.setItem(NUDGE_FIRED_KEY, JSON.stringify([...s]))
  sessionStorage.setItem(NUDGE_COUNT_KEY, String(nudgeCount() + 1))
}

export default function BlobertWidget() {
  const { themeId } = useTheme()
  const reduced = useReducedMotion()
  const { copyMode } = useHireTone()
  const tone = toneFromCopyMode(copyMode)
  const skin = getSkin(themeId)
  const location = useLocation()
  const navigate = useNavigate()
  const onHire = location.pathname === '/hire'

  const [mode, setMode] = useState(() => (sessionStorage.getItem(NAP_KEY) ? 'napping' : 'bubble'))
  const [messages, setMessages] = useState([])
  const [pending, setPending] = useState(false)
  const [gaze, setGaze] = useState(null)          // eye override (glance + highlight track)
  const [waking, setWaking] = useState(false)     // playing the wake stretch/blinks
  const [blinkSignal, setBlinkSignal] = useState(null)
  const [nudge, setNudge] = useState(null)        // { key, chipKey, text }
  const [autoFocus, setAutoFocus] = useState(false)

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

  // Idle / nap / gaze bookkeeping.
  const bubbleFx = useAnimationControls()
  const lastActRef = useRef(null)
  const yawnCountRef = useRef(0)
  const lastInteractRef = useRef(Date.now()) // any interaction (drives yawn timer)
  const gazeLockRef = useRef(false)          // highlight track owns the eyes; block glances
  const gazeReleaseRef = useRef(null)
  const napPoseRef = useRef('normal')
  const snoreRef = useRef('zzz')

  // Nudge bookkeeping.
  const sessionStartRef = useRef(Date.now())
  const pageEnteredRef = useRef(Date.now())
  const lastNudgeAtRef = useRef(0)
  const lastBlobertInteractRef = useRef(0)   // 0 = never; drives the 60s cooldown
  const factCandidateRef = useRef(null)      // { key, since }
  const themeChangedRef = useRef(false)
  const toneTouchedRef = useRef(false)
  const initialThemeRef = useRef(themeId)
  const initialToneRef = useRef(copyMode)

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

  function registerBlobertInteraction() {
    const t = Date.now()
    lastInteractRef.current = t
    lastBlobertInteractRef.current = t
    yawnCountRef.current = 0
  }

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

  // --- Track theme / tone changes for nudge governors ------------------------
  useEffect(() => { if (themeId !== initialThemeRef.current) themeChangedRef.current = true }, [themeId])
  useEffect(() => { if (copyMode !== initialToneRef.current) toneTouchedRef.current = true }, [copyMode])

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

  // --- Route-change: line + reset per-page nudge timers ----------------------
  const prevPathRef = useRef(location.pathname)
  useEffect(() => {
    const prev = prevPathRef.current
    if (prev === location.pathname) return
    prevPathRef.current = location.pathname
    pageEnteredRef.current = Date.now()
    factCandidateRef.current = null
    if (mode !== 'open') return
    if (sessionStorage.getItem(TRANSITION_KEY)) return
    sessionStorage.setItem(TRANSITION_KEY, '1')
    addMsg({ role: 'blobert', text: routeTransitionLine(), apiHistory: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // --- Idle life: single loop while collapsed + awake, not under reduced motion
  useEffect(() => {
    if (reduced || mode !== 'bubble') return undefined
    let cancelled = false
    let timer

    const doGlance = () => {
      if (gazeLockRef.current) return
      setGaze(randomGlanceGaze())
      window.clearTimeout(gazeReleaseRef.current)
      gazeReleaseRef.current = window.setTimeout(() => {
        if (!gazeLockRef.current) setGaze(null)
      }, 1000 + Math.random() * 1000)
    }
    const doFlavor = () => {
      const t = apiThemeFor(themeId)
      if (t === 'digital') {
        bubbleFx.start({ x: [0, -2, 2, -1, 0], opacity: [1, 0.5, 1, 0.7, 1], transition: { duration: 0.22 } })
      } else if (t === 'retro') {
        bubbleFx.start({ x: [0, -2, 0, 2, 0], y: [0, 1, -1, 0, 0], transition: { duration: 0.3 } })
      } else { // funky (and any future skin that opts into flavor)
        bubbleFx.start({ scaleX: [1, 1.08, 0.94, 1], scaleY: [1, 0.94, 1.06, 1], transition: { duration: 1.4, ease: 'easeInOut' } })
      }
    }
    const runAct = (type) => {
      lastActRef.current = type
      switch (type) {
        case 'glance': doGlance(); break
        case 'sway': bubbleFx.start({ rotate: [0, -6, 6, -3, 0], transition: { duration: 2, ease: 'easeInOut' } }); break
        case 'bounce': bubbleFx.start({ y: [0, -8, 0], transition: { duration: 0.5, ease: 'easeOut' } }); break
        case 'yawn': bubbleFx.start({ scaleY: [1, 1.18, 0.92, 1], scaleX: [1, 0.94, 1.05, 1], transition: { duration: 1.3, ease: 'easeInOut' } }); break
        case 'flavor': doFlavor(); break
        default: break
      }
    }

    const schedule = () => {
      const delay = IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS)
      timer = window.setTimeout(run, delay)
    }
    const run = () => {
      if (cancelled) return
      const idleFor = Date.now() - lastInteractRef.current
      if (idleFor >= YAWN_IDLE_MS) {
        yawnCountRef.current += 1
        runAct('yawn')
        if (yawnCountRef.current >= 2) {
          // Two ignored yawns → he tucks himself in (a self-nap).
          window.setTimeout(() => { if (!cancelled) selfNap() }, 1500)
          return
        }
      } else {
        yawnCountRef.current = 0
        runAct(pickIdleAct(apiThemeFor(themeId), lastActRef.current))
      }
      schedule()
    }
    schedule()
    return () => { cancelled = true; window.clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, mode, themeId])

  // --- Nudge: watch project cards enter the viewport (fun-facts trigger) ------
  useEffect(() => {
    if (nudgeSilenced() || firedSet().has('fun-facts')) return undefined
    let obs
    let retryTimer
    let tries = 0
    const keyFor = (el) => {
      const d = el.getAttribute('data-blobert-fact')
      if (d && hasProjectFacts(d)) return d
      const id = el.id || ''
      const raw = id.startsWith('blobert-card-') ? id.slice('blobert-card-'.length) : ''
      return hasProjectFacts(raw) ? raw : null
    }
    const setup = () => {
      const els = [
        ...document.querySelectorAll('[data-blobert-fact]'),
        ...document.querySelectorAll('[id^="blobert-card-"]'),
      ].filter(keyFor)
      if (!els.length) { if (tries++ < 20) retryTimer = window.setTimeout(setup, 300); return }
      obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          const key = keyFor(e.target)
          if (!key) return
          if (e.isIntersecting && e.intersectionRatio >= 0.5) {
            if (factCandidateRef.current?.key !== key) factCandidateRef.current = { key, since: Date.now() }
          } else if (factCandidateRef.current?.key === key) {
            factCandidateRef.current = null
          }
        })
      }, { threshold: [0, 0.5, 1] })
      els.forEach(el => obs.observe(el))
    }
    setup()
    return () => { if (obs) obs.disconnect(); window.clearTimeout(retryTimer); factCandidateRef.current = null }
  }, [location.pathname])

  // --- Nudge: single governor loop (all rules enforced here) -----------------
  useEffect(() => {
    const id = window.setInterval(() => {
      if (nudge) return
      if (nudgeSilenced() || nudgeCount() >= NUDGE_SESSION_CAP) return
      if (mode === 'open' || mode === 'napping' || waking) return
      if (document.hidden || isInputFocused()) return
      const now = Date.now()
      if (now - pageEnteredRef.current < NUDGE_PAGE_MIN_MS) return
      if (now - lastNudgeAtRef.current < NUDGE_MIN_GAP_MS) return
      if (lastBlobertInteractRef.current && now - lastBlobertInteractRef.current < NUDGE_INTERACTION_COOLDOWN_MS) return

      const fired = firedSet()
      const theme = apiThemeFor(themeId)

      // 4. fun-facts — most contextual, so evaluate first.
      const fc = factCandidateRef.current
      if (!fired.has('fun-facts') && fc && now - fc.since >= NUDGE_FACT_DWELL_MS) {
        const line = projectFactLine(fc.key)
        if (line) { fireNudge('fun-facts', line, fc.key); return }
      }
      // 2. tone-toggle — /hire only.
      if (onHire && !fired.has('tone-toggle') && !toneTouchedRef.current && now - pageEnteredRef.current >= NUDGE_TONE_MS) {
        fireNudge('tone-toggle', nudgeToneLine(), 'tone-toggle'); return
      }
      // 1. dwell-no-chat.
      if (!fired.has('dwell-no-chat') && !openedRef.current && now - pageEnteredRef.current >= NUDGE_DWELL_MS) {
        fireNudge('dwell-no-chat', nudgeDwellLine(theme), 'dwell-no-chat'); return
      }
      // 3. theme-tease.
      if (!fired.has('theme-tease') && !themeChangedRef.current && now - sessionStartRef.current >= NUDGE_THEME_MS) {
        fireNudge('theme-tease', nudgeThemeLine(), 'theme-tease'); return
      }
    }, 1500)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nudge, mode, waking, themeId, onHire])

  function fireNudge(type, text, chipKey) {
    markNudgeFired(type)
    lastNudgeAtRef.current = Date.now()
    setNudge({ key: type, chipKey, text })
  }

  // --- Open / wake / dismiss transitions ------------------------------------
  function finishOpen(wasNapping) {
    const selfNapped = sessionStorage.getItem(NAP_KEY) === 'self'
    setMode('open')
    sessionStorage.removeItem(NAP_KEY)
    setNudge(null)
    openedRef.current = true
    if (wasNapping) {
      addMsg({ role: 'blobert', text: selfNapped ? sheepishWakeLine() : wakeLine(), apiHistory: false })
    } else if (!greetedRef.current) {
      greetedRef.current = true
      addMsg({
        role: 'blobert',
        text: routeGreetingLine(location.pathname, apiThemeFor(themeId), tone),
        apiHistory: false,
        chips: STARTER_CHIPS.map(label => ({ label, action: 'send' })),
      })
    }
  }

  // Wake sequence: brief stretch + two blinks (~800ms), then open. Reduced motion
  // opens instantly (line only).
  function playWakeSequence(done) {
    setWaking(true)
    setGaze(null)
    bubbleFx.start({ scaleY: [1, 1.16, 0.96, 1], scaleX: [1, 0.95, 1.03, 1], transition: { duration: 0.5, ease: 'easeOut' } })
    setBlinkSignal(s => s + 1)
    window.setTimeout(() => setBlinkSignal(s => s + 1), 260)
    window.setTimeout(() => { setWaking(false); done() }, 800)
  }

  function openPanel() {
    const wasNapping = mode === 'napping'
    registerBlobertInteraction()
    if (wasNapping && !reduced) { playWakeSequence(() => finishOpen(true)); return }
    finishOpen(wasNapping)
  }

  function openFromNudge(n) {
    registerBlobertInteraction()
    const chip = nudgeChipFor(n.chipKey || n.key)
    greetedRef.current = true
    setNudge(null)
    setMode('open')
    sessionStorage.removeItem(NAP_KEY)
    openedRef.current = true
    setAutoFocus(true)
    window.setTimeout(() => setAutoFocus(false), 400)
    addMsg({ role: 'blobert', text: n.text, apiHistory: false, chips: [{ label: chip, action: 'send' }] })
  }

  function dismissNudge() {
    setNudge(null)
    sessionStorage.setItem(NUDGE_SILENCE_KEY, '1')
  }

  function napWithPose(kind) {
    napPoseRef.current = pickNapPose(apiThemeFor(themeId), napPoseRef.current)
    snoreRef.current = pickSnore(reduced)
    setMode('napping')
    sessionStorage.setItem(NAP_KEY, kind)
    yawnCountRef.current = 0
  }
  function dismiss() { napWithPose('1') }        // manual dismissal
  function selfNap() { napWithPose('self') }     // two ignored yawns

  // --- Highlight tracking: drive the eyes toward the pulsed card -------------
  function driveGazeToEl(el) {
    setGaze(gazeTowardEl(el))
    gazeLockRef.current = true
    window.clearTimeout(gazeReleaseRef.current)
    // Reduced motion still shifts the pupils once, just releases a touch sooner.
    gazeReleaseRef.current = window.setTimeout(() => {
      gazeLockRef.current = false
      setGaze(null)
    }, reduced ? 1200 : 1700)
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
        path: location.pathname,
        sessionId: sessionIdRef.current,
      }),
    })
    return resp.json()
  }, [themeId, tone, location.pathname])

  // --- Send a normal visitor message ----------------------------------------
  async function sendMessage(text) {
    const trimmed = String(text).trim()
    if (!trimmed || pending) return
    registerBlobertInteraction()

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

    if (highlight) fireHighlight(highlight)
    else if (openContact) fireOpenContact()
  }

  // On /hire the target cards/CTA exist now; off /hire we navigate there first,
  // then poll for the element before running the scroll+pulse. Either way, once
  // the element is found we drive Blobert's eyes toward it for the pulse.
  function fireHighlight(slug) {
    const id = `blobert-card-${slug}`
    const run = (el) => { pulseElement(id, reduced); driveGazeToEl(el || document.getElementById(id)) }
    if (onHire) { const el = document.getElementById(id); if (el) run(el); return }
    navigate('/hire')
    pollForElement(id, 2000, run)
  }

  function fireOpenContact() {
    if (onHire) {
      const el = document.getElementById('blobert-contact-cta')
      pulseElement('blobert-contact-cta', reduced)
      if (el) driveGazeToEl(el)
      return
    }
    navigate('/contact')
  }

  // --- Lead draft: Haiku draft → contact-form prefill (clipboard = fallback) --
  async function runLeadDraft() {
    if (pending || leadInFlightRef.current) return
    leadInFlightRef.current = true
    registerBlobertInteraction()
    // The instruction goes to the brain as the visitor's latest turn but is not
    // shown as a user bubble.
    addMsg({ role: 'user', text: LEAD_DRAFT_INSTRUCTION, apiHistory: true, hidden: true })
    const pendingId = addMsg({ role: 'blobert', text: '', pending: true, apiHistory: false })
    setPending(true)

    const finish = () => { setPending(false); leadInFlightRef.current = false }

    let data
    try {
      data = await callBrain(LEAD_DRAFT_INSTRUCTION)
    } catch {
      replacePending(pendingId, { role: 'blobert', text: networkFallbackLine(), apiHistory: false })
      finish()
      return
    }

    const draft = parseTokens(data?.reply || '').text
    if (!draft || (data?.source !== 'ai' && data?.source !== 'cache' && data?.source !== 'fuzzy')) {
      replacePending(pendingId, { role: 'blobert', text: data?.reply || networkFallbackLine(), apiHistory: false })
      finish()
      return
    }

    // Primary path: stash the draft where the contact form will pick it up, tell
    // the form (in case it's already mounted), then route there.
    let stored = false
    try {
      sessionStorage.setItem(LEAD_STORAGE_KEY, draft)
      window.dispatchEvent(new CustomEvent('blobert-lead-draft'))
      stored = true
    } catch { stored = false }

    if (stored) {
      replacePending(pendingId, { role: 'blobert', text: leadDeliveredLine(), apiHistory: false })
      navigate('/contact')
      finish()
      return
    }

    // Fallback: clipboard (prefill storage unavailable).
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
    if (onHire) pulseElement('blobert-contact-cta', reduced)
    else navigate('/contact')
    finish()
  }

  const blobState = pending ? 'thinking' : (mode === 'napping' ? 'napping' : 'idle')
  const napping = mode === 'napping'
  const showNap = napping && !waking
  const bubbleBlobState = waking ? 'idle' : blobState
  const c = skin.colors

  // Avoid colliding with other fixed chrome. Two additive offset sources:
  //  - per-theme: Digital's SoundToggle (bottom-right) and Retro's 28px status bar
  //  - per-route: /hub's bottom-center controls cluster (lift the bubble above it)
  const THEME_BOTTOM_LIFT = { retro: 30 }
  const ROUTE_BOTTOM_LIFT = { '/hub': 84 }
  const bottomExtra = (THEME_BOTTOM_LIFT[themeId] || 0) + (ROUTE_BOTTOM_LIFT[location.pathname] || 0)
  const bubbleRight = themeId === 'digital'
    ? 'calc(88px + env(safe-area-inset-right, 0px))'
    : 'max(16px, env(safe-area-inset-right))'
  const bubbleBottom = `calc(max(16px, env(safe-area-inset-bottom)) + ${bottomExtra}px)`
  // Nudge sits just above the 72px blob.
  const nudgeBottom = `calc(max(16px, env(safe-area-inset-bottom)) + ${bottomExtra + 88}px)`

  return (
    <>
      <AnimatePresence>
        {mode === 'open' && (
          <BlobertChat
            key="panel"
            skin={skin}
            reduced={reduced}
            blobState={blobState}
            gaze={gaze}
            messages={messages}
            inputDisabled={pending}
            isMobile={isMobile}
            kbInset={kbInset}
            bottomExtra={bottomExtra}
            autoFocus={autoFocus}
            revealedRef={revealedRef}
            onSend={sendMessage}
            onLeadDraft={runLeadDraft}
            onClose={dismiss}
          />
        )}
      </AnimatePresence>

      {/* Proactive nudge — only while collapsed + awake. */}
      <AnimatePresence>
        {nudge && mode !== 'open' && !napping && (
          <BlobertNudge
            key={nudge.key}
            skin={skin}
            reduced={reduced}
            text={nudge.text}
            isMobile={isMobile}
            right={bubbleRight}
            bottom={nudgeBottom}
            onOpen={() => openFromNudge(nudge)}
            onDismiss={dismissNudge}
            onExpire={() => setNudge(null)}
          />
        )}
      </AnimatePresence>

      {/* Bubble affordance — hidden while the panel is open. */}
      {mode !== 'open' && (
        <button
          onClick={openPanel}
          aria-label={napping ? 'Wake Blobert' : 'Chat with Blobert'}
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
            filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.3))',
          }}
        >
          {/* Nap pose layer (static transform; only while actually napping). */}
          <div style={{
            transform: showNap ? poseTransform(napPoseRef.current) : 'none',
            transition: reduced ? 'none' : 'transform 0.5s ease',
          }}>
            <motion.span animate={bubbleFx} style={{ position: 'relative', display: 'inline-flex', transformOrigin: 'center bottom' }}>
              <BlobertBlob skin={skin} reduced={reduced} state={bubbleBlobState} size={72} gaze={gaze} blinkSignal={blinkSignal} />

              {/* Snore variants while napping (motion allowed only). */}
              {showNap && !reduced && snoreRef.current === 'zzz' && (
                <span aria-hidden="true" style={{ position: 'absolute', top: -6, right: -10, fontFamily: skin.fonts.mono, color: c.textMuted, fontSize: 12, lineHeight: 1 }}>
                  {['z', 'z', 'z'].map((z, i) => (
                    <span key={i} className="blobert-z" style={{ display: 'inline-block', animationDelay: `${i * 0.4}s`, fontSize: 10 + i * 2 }}>{z}</span>
                  ))}
                </span>
              )}
              {showNap && !reduced && snoreRef.current === 'bigZ' && (
                <span aria-hidden="true" className="blobert-bigz" style={{ position: 'absolute', top: -14, right: -12, fontFamily: skin.fonts.mono, color: c.textMuted, fontSize: 20, lineHeight: 1, fontWeight: 700 }}>
                  Z
                </span>
              )}
              {showNap && !reduced && snoreRef.current === 'bubble' && (
                <span aria-hidden="true" className="blobert-snorebubble" style={{ position: 'absolute', top: 2, right: -8, width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${c.textMuted}`, background: 'transparent' }} />
              )}
              {/* Static snore glyph under reduced motion so the nap still reads. */}
              {showNap && reduced && (
                <span aria-hidden="true" style={{ position: 'absolute', top: -6, right: -8, fontFamily: skin.fonts.mono, color: c.textMuted, fontSize: 12, lineHeight: 1 }}>z</span>
              )}

              {/* Chat affordance dot — only in the awake bubble state. */}
              {mode === 'bubble' && !waking && (
                <span aria-hidden="true" style={{
                  position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%',
                  background: c.accent, color: c.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, border: `2px solid ${c.base}`,
                }}>
                  💬
                </span>
              )}
            </motion.span>
          </div>
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
        .blobert-bigz { animation: blobert-bigz 3s ease-in-out infinite; }
        @keyframes blobert-bigz { 0%{ transform: translateY(0) scale(0.9); opacity: 0; } 30%{ opacity: 1; } 100%{ transform: translateY(-16px) scale(1.15); opacity: 0; } }
        .blobert-snorebubble { animation: blobert-snorebubble 3.4s ease-in-out infinite; }
        @keyframes blobert-snorebubble { 0%{ transform: scale(0.3); opacity: 0; } 55%{ transform: scale(1); opacity: 0.9; } 78%{ transform: scale(1.15); opacity: 0.9; } 82%{ transform: scale(1.4); opacity: 0; } 100%{ transform: scale(0.3); opacity: 0; } }

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
          .blobert-body-breathe, .blobert-body-jitter, .blobert-body-morph, .blobert-z, .blobert-bigz, .blobert-snorebubble, .blobert-dots span { animation: none !important; }
          .blobert-pulse { animation: none !important; box-shadow: 0 0 0 3px var(--color-accent-primary); }
        }
      `}</style>
    </>
  )
}

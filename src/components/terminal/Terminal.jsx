import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSound } from '@/sound/useSound'

const ROUTES = ['portfolio', 'skills', 'services', 'lab', 'store', 'media', 'about', 'contact']

const HELP_LINES = [
  '  help             list commands',
  '  ls               list top-level routes',
  '  ls projects      list portfolio projects',
  '  cd [route]       navigate to route',
  '  whoami           display user info',
  '  clear            clear output',
  '  exit             close terminal',
]

const INIT_OUTPUT = [
  { type: 'system', text: 'freshprints.dev terminal v1.0' },
  { type: 'system', text: "type 'help' for available commands." },
  { type: 'spacer' },
]

export default function Terminal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { play } = useSound()
  const [output, setOutput] = useState(INIT_OUTPUT)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const inputRef = useRef()
  const outputRef = useRef()
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  // Open / close sounds
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) play('terminalOpen')
    if (!isOpen && wasOpenRef.current) play('terminalClose')
    wasOpenRef.current = isOpen
  }, [isOpen, play])

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [output])

  const handleCommand = (raw) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/)
    let lines = []
    let shouldNavigate = null

    if (cmd === 'clear') {
      setOutput([])
      setHistory((prev) => [trimmed, ...prev])
      setHistoryIdx(-1)
      return
    }

    if (cmd === 'help') {
      lines = HELP_LINES
    } else if (cmd === 'ls') {
      if (args[0] === 'projects') {
        lines = ['  no projects indexed']
      } else {
        lines = ROUTES.map((r) => `  /${r}`)
      }
    } else if (cmd === 'cd') {
      const target = args[0]?.replace(/^\//, '')
      if (!target) {
        lines = ['  usage: cd [route]']
      } else if (ROUTES.includes(target)) {
        lines = ['  navigating...']
        shouldNavigate = `/${target}`
      } else {
        lines = [`  cd: no such route: ${args[0]}`]
      }
    } else if (cmd === 'whoami') {
      lines = [
        '  Kyle DeBord',
        '  Mechanical Designer | Software Developer | Game Developer',
        '  Location: United States',
      ]
    } else if (cmd === 'exit') {
      onClose()
      return
    } else {
      lines = [`  command not found: ${trimmed}. type 'help' for available commands.`]
    }

    setOutput((prev) => [
      ...prev,
      { type: 'input', text: trimmed },
      ...lines.map((text) => ({ type: 'output', text })),
      { type: 'spacer' },
    ])
    setHistory((prev) => [trimmed, ...prev])
    setHistoryIdx(-1)

    if (shouldNavigate) {
      const dest = shouldNavigate
      setTimeout(() => { onClose(); navigate(dest) }, 300)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      play('terminalSubmit')
      handleCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(historyIdx + 1, history.length - 1)
      setHistoryIdx(next)
      setInput(history[next] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(historyIdx - 1, -1)
      setHistoryIdx(next)
      setInput(next === -1 ? '' : history[next])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-bg-overlay)',
            backdropFilter: 'blur(4px)',
            zIndex: 'var(--z-terminal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%',
              maxWidth: 700,
              maxHeight: '80vh',
              margin: 'var(--space-4)',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid var(--color-border-subtle)',
              background: 'var(--color-bg-elevated)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: 6, marginRight: 'var(--space-4)' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56', display: 'block' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E', display: 'block' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F', display: 'block' }} />
              </div>
              <span style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
              }}>
                freshprints.dev — terminal
              </span>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  padding: 'var(--space-1)',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Output */}
            <div
              ref={outputRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-4)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                lineHeight: '1.8',
              }}
            >
              {output.map((line, i) => {
                if (line.type === 'spacer') return <div key={i} style={{ height: 'var(--space-1)' }} />
                return (
                  <div key={i} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {line.type === 'input' && (
                      <span style={{ color: 'var(--color-text-accent)', flexShrink: 0 }}>
                        kyle@freshprints:~$
                      </span>
                    )}
                    <span style={{
                      color: line.type === 'system'
                        ? 'var(--color-text-muted)'
                        : line.type === 'input'
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-secondary)',
                    }}>
                      {line.text}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Prompt */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--space-3) var(--space-4)',
              borderTop: '1px solid var(--color-border-subtle)',
              gap: 'var(--space-2)',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-accent)',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}>
                kyle@freshprints:~$
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); play('terminalKey') }}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoComplete="off"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-primary)',
                  caretColor: 'var(--color-text-accent)',
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

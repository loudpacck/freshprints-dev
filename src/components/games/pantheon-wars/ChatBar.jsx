import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from './ChatContext'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

const GOLD     = 'rgba(201,169,97,1)'
const GOLD_DIM = 'rgba(201,169,97,0.6)'
const GOLD_MUT = 'rgba(201,169,97,0.25)'
const BG       = 'rgba(0,0,0,0.88)'
const BORDER   = 'rgba(255,255,255,0.08)'

const TABS = [
  { id: 'general', label: 'GENERAL' },
  { id: 'dm',      label: 'PRIVATE' },
  { id: 'mod',     label: 'MOD'     },
]

function formatTime(iso) {
  const d = new Date(iso)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function MessageList({ messages, onUsernameClick, listRef }) {
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, listRef])

  if (!messages.length) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.25)', fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11, letterSpacing: '0.06em',
      }}>
        No messages yet. Say something!
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(201,169,97,0.2) transparent',
      }}
    >
      {messages.map(msg => (
        <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.4 }}>
          <button
            onClick={() => onUsernameClick(msg.sender_username)}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: GOLD, fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              flexShrink: 0, letterSpacing: '0.04em',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
          >
            {msg.sender_username}
          </button>
          <span style={{
            color: 'rgba(255,255,255,0.87)', fontSize: 12,
            fontFamily: "'DM Sans', sans-serif", flex: 1,
            wordBreak: 'break-word',
          }}>
            {msg.content}
          </span>
          <span style={{
            color: 'rgba(255,255,255,0.28)', fontSize: 9,
            fontFamily: "'IBM Plex Mono', monospace",
            flexShrink: 0, alignSelf: 'flex-end', letterSpacing: '0.05em',
          }}>
            {formatTime(msg.created_at)}
          </span>
        </div>
      ))}
    </div>
  )
}

function PlaceholderTab({ label }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8,
      color: 'rgba(255,255,255,0.3)',
    }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10, letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: 2,
        color: GOLD_MUT,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
      }}>
        Coming soon
      </div>
    </div>
  )
}

export default function ChatBar() {
  const { user }                                  = usePantheonWars()
  const { isOpen, setIsOpen, activeTab, setActiveTab,
          messages, unread, sendMessage }          = useChat()
  const [input, setInput]                         = useState('')
  const [sending, setSending]                     = useState(false)
  const [errorMsg, setErrorMsg]                   = useState(null)
  const [toast, setToast]                         = useState(null)
  const inputRef                                  = useRef(null)
  const listRef                                   = useRef(null)

  if (!user) return null

  const totalUnread = (unread.general || 0) + (unread.dm || 0)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleUsernameClick(username) {
    if (username === user.username) return
    showToast('Direct messages coming soon.')
  }

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return
    if (activeTab !== 'general') return

    setSending(true)
    setErrorMsg(null)
    try {
      const data = await sendMessage('general', content)
      if (data.ok) {
        setInput('')
      } else if (data.error === 'rate_limited') {
        setErrorMsg('Slow down — too many messages.')
      } else if (data.error === 'muted') {
        setErrorMsg('You are muted from chat.')
      } else {
        setErrorMsg(data.message || 'Failed to send message.')
      }
    } catch {
      setErrorMsg('Network error.')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = input.trim().length > 0 && !sending && activeTab === 'general'

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 25,
      background: BG,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: `1px solid ${BORDER}`,
    }}>
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            style={{
              position: 'absolute', bottom: '100%', left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(10,7,16,0.92)',
              border: `1px solid ${GOLD_MUT}`,
              borderRadius: 6,
              padding: '6px 14px',
              color: GOLD_DIM,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              whiteSpace: 'nowrap',
              marginBottom: 6,
              pointerEvents: 'none',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed bar */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            height: 40, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 16px',
            cursor: 'pointer', userSelect: 'none',
          }}
          role="button"
          aria-label="Open chat"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10, letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: GOLD_DIM,
            }}>
              {activeTab === 'general' ? 'GENERAL CHAT' : activeTab === 'dm' ? 'MESSAGES' : 'MOD CHAT'}
            </span>
            {totalUnread > 0 && (
              <span style={{
                background: GOLD,
                color: '#0A0A0F',
                borderRadius: 8,
                padding: '1px 6px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, fontWeight: 700,
                lineHeight: 1.6,
              }}>
                {totalUnread}
              </span>
            )}
          </div>
          <span style={{ color: GOLD_MUT, fontSize: 14, lineHeight: 1 }}>▲</span>
        </div>
      )}

      {/* Expanded panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'clamp(220px, 33vh, 340px)', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header: tabs + collapse button */}
            <div style={{
              display: 'flex', alignItems: 'stretch',
              borderBottom: `1px solid ${BORDER}`,
              height: 36, flexShrink: 0,
            }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id
                      ? `2px solid ${GOLD}`
                      : '2px solid transparent',
                    padding: '0 16px',
                    cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.35)',
                    transition: 'color 120ms, border-color 120ms',
                    display: 'flex', alignItems: 'center', gap: 6,
                    position: 'relative',
                  }}
                >
                  {tab.label}
                  {tab.id === 'general' && unread.general > 0 && (
                    <span style={{
                      background: GOLD, color: '#0A0A0F',
                      borderRadius: 6, padding: '1px 5px',
                      fontSize: 8, fontWeight: 700, lineHeight: 1.6,
                    }}>
                      {unread.general}
                    </span>
                  )}
                  {tab.id === 'dm' && unread.dm > 0 && (
                    <span style={{
                      background: GOLD, color: '#0A0A0F',
                      borderRadius: 6, padding: '1px 5px',
                      fontSize: 8, fontWeight: 700, lineHeight: 1.6,
                    }}>
                      {unread.dm}
                    </span>
                  )}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Collapse chat"
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: GOLD_MUT,
                  padding: '0 14px', fontSize: 13,
                  transition: 'color 120ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = GOLD_DIM }}
                onMouseLeave={e => { e.currentTarget.style.color = GOLD_MUT }}
              >
                ▼
              </button>
            </div>

            {/* Message area */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              minHeight: 0,
            }}>
              {activeTab === 'general' && (
                <MessageList
                  messages={messages.general}
                  onUsernameClick={handleUsernameClick}
                  listRef={listRef}
                />
              )}
              {activeTab === 'dm' && (
                <PlaceholderTab label="Direct Messages" />
              )}
              {activeTab === 'mod' && (
                <PlaceholderTab label="Moderator Chat" />
              )}
            </div>

            {/* Input row */}
            {activeTab === 'general' && (
              <div style={{
                display: 'flex', gap: 8, padding: '8px 12px',
                borderTop: `1px solid ${BORDER}`,
                flexShrink: 0,
              }}>
                {errorMsg && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 12,
                    background: 'rgba(220,50,50,0.15)',
                    border: '1px solid rgba(220,50,50,0.3)',
                    borderRadius: 4,
                    padding: '4px 10px',
                    color: 'rgba(255,100,100,0.9)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    marginBottom: 4,
                  }}>
                    {errorMsg}
                  </div>
                )}
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); setErrorMsg(null) }}
                  onKeyDown={handleKeyDown}
                  placeholder="Message general chat…"
                  maxLength={500}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid rgba(255,255,255,0.12)`,
                    borderRadius: 6,
                    padding: '7px 10px',
                    color: '#F0F0F8',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    outline: 'none',
                    transition: 'border-color 150ms',
                  }}
                  onFocus={e => { e.target.style.borderColor = GOLD_MUT }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  style={{
                    background: canSend
                      ? 'linear-gradient(135deg, rgba(201,169,97,0.9) 0%, rgba(245,216,139,0.85) 100%)'
                      : 'rgba(201,169,97,0.12)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '7px 16px',
                    color: canSend ? '#0A0A0F' : 'rgba(201,169,97,0.3)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    cursor: canSend ? 'pointer' : 'not-allowed',
                    transition: 'background 150ms, color 150ms',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {sending ? '…' : 'SEND'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

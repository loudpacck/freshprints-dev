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
  { id: 'private', label: 'PRIVATE' },
  { id: 'mod',     label: 'MOD'     },
]

function formatTime(iso) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return formatTime(iso)
  return `${d.getMonth()+1}/${d.getDate()}`
}

// ── General message list ──────────────────────────────────────────────────────

function MessageList({ messages, onUsernameClick, listRef }) {
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
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
        flex: 1, overflowY: 'auto',
        padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,169,97,0.2) transparent',
      }}
    >
      {messages.map(msg => (
        <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.4 }}>
          <button
            onClick={() => onUsernameClick(msg.sender_id, msg.sender_username)}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: GOLD, fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              flexShrink: 0, letterSpacing: '0.04em', textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
          >
            {msg.sender_username}
          </button>
          <span style={{
            color: 'rgba(255,255,255,0.87)', fontSize: 12,
            fontFamily: "'DM Sans', sans-serif", flex: 1, wordBreak: 'break-word',
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

// ── DM: thread list row ───────────────────────────────────────────────────────

function DmThreadRow({ thread, onOpen }) {
  return (
    <button
      onClick={() => onOpen(thread.thread_id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', background: 'none', border: 'none',
        borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
        width: '100%', textAlign: 'left',
        transition: 'background 120ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,97,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
    >
      {/* Avatar placeholder */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'rgba(201,169,97,0.15)',
        border: `1px solid ${GOLD_MUT}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700,
        color: GOLD_DIM, flexShrink: 0,
      }}>
        {thread.other_username[0].toUpperCase()}
      </div>

      {/* Username + preview */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          fontWeight: 600, color: GOLD, letterSpacing: '0.04em',
          marginBottom: 2,
        }}>
          {thread.other_username}
        </div>
        {thread.last_message_preview && (
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            maxWidth: 160,
          }}>
            {thread.last_message_preview}
          </div>
        )}
      </div>

      {/* Timestamp + unread */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        {thread.last_message_at && (
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
            color: 'rgba(255,255,255,0.28)', letterSpacing: '0.05em',
          }}>
            {formatDate(thread.last_message_at)}
          </span>
        )}
        {thread.unread_count > 0 && (
          <span style={{
            background: GOLD, color: '#0A0A0F',
            borderRadius: 8, padding: '1px 6px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9, fontWeight: 700, lineHeight: 1.6,
          }}>
            {thread.unread_count}
          </span>
        )}
      </div>
    </button>
  )
}

// ── DM: thread list view ──────────────────────────────────────────────────────

function DmThreadList({ threads, onOpen, onCompose }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD_MUT,
        }}>
          CONVERSATIONS
        </span>
        <button
          onClick={onCompose}
          title="New direct message"
          style={{
            background: 'none', border: `1px solid ${GOLD_MUT}`,
            borderRadius: 4, padding: '2px 7px',
            color: GOLD_DIM, fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            transition: 'border-color 120ms, color 120ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = GOLD
            e.currentTarget.style.color = GOLD
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = GOLD_MUT
            e.currentTarget.style.color = GOLD_DIM
          }}
        >
          +
        </button>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,169,97,0.2) transparent' }}>
        {threads.length === 0 ? (
          <div style={{
            padding: '20px 16px', textAlign: 'center',
            color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", fontSize: 12,
            lineHeight: 1.6,
          }}>
            No conversations yet.
            <br />
            <span style={{ color: GOLD_MUT, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>
              /w username message
            </span>
            <br />
            or click a player's name in General chat.
          </div>
        ) : (
          threads.map(t => <DmThreadRow key={t.thread_id} thread={t} onOpen={onOpen} />)
        )}
      </div>
    </div>
  )
}

// ── DM: individual thread view ────────────────────────────────────────────────

function DmThreadView({ thread, messages, currentUserId, sendDm, onBack, fetchThreadsList }) {
  const [input, setInput]     = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [thread?.thread_id])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending || !thread) return
    setSending(true)
    setError(null)
    try {
      const data = await sendDm(thread.other_username, content)
      if (data.ok) {
        setInput('')
        fetchThreadsList()
      } else if (data.error === 'rate_limited') {
        setError('Slow down — too many messages.')
      } else if (data.error === 'muted') {
        setError('You are muted from chat.')
      } else {
        setError(data.message || 'Failed to send.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const msgs = messages || []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Thread header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 10px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: GOLD_DIM, fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, padding: '2px 4px', transition: 'color 120ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = GOLD }}
          onMouseLeave={e => { e.currentTarget.style.color = GOLD_DIM }}
        >
          ← Back
        </button>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          fontWeight: 600, color: GOLD, letterSpacing: '0.04em',
        }}>
          {thread ? thread.other_username : ''}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '8px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,169,97,0.2) transparent',
        }}
      >
        {msgs.length === 0 && (
          <div style={{
            textAlign: 'center', color: 'rgba(255,255,255,0.25)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, marginTop: 16,
          }}>
            Start the conversation.
          </div>
        )}
        {msgs.map(msg => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: isMine ? 'row-reverse' : 'row',
              alignItems: 'flex-end', gap: 6,
            }}>
              <div style={{
                maxWidth: '72%',
                background: isMine ? 'rgba(201,169,97,0.18)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${isMine ? 'rgba(201,169,97,0.3)' : BORDER}`,
                borderRadius: 8, padding: '6px 10px',
              }}>
                {!isMine && (
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                    color: GOLD_DIM, marginBottom: 3, letterSpacing: '0.04em',
                  }}>
                    {msg.sender_username}
                  </div>
                )}
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  color: 'rgba(255,255,255,0.9)', wordBreak: 'break-word', lineHeight: 1.4,
                }}>
                  {msg.content}
                </div>
              </div>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                color: 'rgba(255,255,255,0.25)', flexShrink: 0, letterSpacing: '0.05em',
              }}>
                {formatTime(msg.created_at)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Input row */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 12px',
        borderTop: `1px solid ${BORDER}`, flexShrink: 0, position: 'relative',
      }}>
        {error && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 12,
            background: 'rgba(220,50,50,0.15)', border: '1px solid rgba(220,50,50,0.3)',
            borderRadius: 4, padding: '4px 10px',
            color: 'rgba(255,100,100,0.9)', fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10, marginBottom: 4,
          }}>
            {error}
          </div>
        )}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={thread ? `Message ${thread.other_username}…` : 'Message…'}
          maxLength={500}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 6,
            padding: '7px 10px', color: '#F0F0F8',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none',
            transition: 'border-color 150ms',
          }}
          onFocus={e => { e.target.style.borderColor = GOLD_MUT }}
          onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            background: (input.trim() && !sending)
              ? 'linear-gradient(135deg, rgba(201,169,97,0.9) 0%, rgba(245,216,139,0.85) 100%)'
              : 'rgba(201,169,97,0.12)',
            border: 'none', borderRadius: 6, padding: '7px 16px',
            color: (input.trim() && !sending) ? '#0A0A0F' : 'rgba(201,169,97,0.3)',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            fontWeight: 700, letterSpacing: '0.06em',
            cursor: (input.trim() && !sending) ? 'pointer' : 'not-allowed',
            transition: 'background 150ms, color 150ms', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {sending ? '…' : 'SEND'}
        </button>
      </div>
    </div>
  )
}

// ── DM: compose new DM view ───────────────────────────────────────────────────

function DmComposeView({ initialUsername, currentUserId, sendDm, onBack, onThreadOpened, fetchThreadsList }) {
  const [username, setUsername]   = useState(initialUsername || '')
  const [message, setMessage]     = useState('')
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState(null)
  const usernameRef = useRef(null)
  const messageRef  = useRef(null)

  useEffect(() => {
    if (initialUsername) {
      messageRef.current?.focus()
    } else {
      usernameRef.current?.focus()
    }
  }, [initialUsername])

  async function handleSend() {
    const content = message.trim()
    const target  = username.trim()
    if (!content || !target || sending) return
    setSending(true)
    setError(null)
    try {
      const data = await sendDm(target, content)
      if (data.ok) {
        fetchThreadsList()
        onThreadOpened(data.thread_id)
      } else {
        setError(data.message || 'Failed to send.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setSending(false)
    }
  }

  const canSend = username.trim().length > 0 && message.trim().length > 0 && !sending

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 10px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: GOLD_DIM, fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, padding: '2px 4px', transition: 'color 120ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = GOLD }}
          onMouseLeave={e => { e.currentTarget.style.color = GOLD_DIM }}
        >
          ← Back
        </button>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          color: GOLD_MUT, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          New Message
        </span>
      </div>

      {/* Compose form */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: 8, padding: '12px',
        justifyContent: 'flex-end',
      }}>
        {error && (
          <div style={{
            background: 'rgba(220,50,50,0.15)', border: '1px solid rgba(220,50,50,0.3)',
            borderRadius: 4, padding: '6px 10px',
            color: 'rgba(255,100,100,0.9)', fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
            color: GOLD_MUT, flexShrink: 0, letterSpacing: '0.06em',
          }}>
            TO:
          </span>
          <input
            ref={usernameRef}
            value={username}
            onChange={e => { setUsername(e.target.value); setError(null) }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); messageRef.current?.focus() } }}
            placeholder="Username"
            disabled={!!initialUsername}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 6,
              padding: '6px 10px', color: initialUsername ? GOLD_DIM : '#F0F0F8',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, outline: 'none',
              transition: 'border-color 150ms',
              opacity: initialUsername ? 0.7 : 1,
            }}
            onFocus={e => { if (!initialUsername) e.target.style.borderColor = GOLD_MUT }}
            onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={messageRef}
            value={message}
            onChange={e => { setMessage(e.target.value); setError(null) }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Write a message…"
            maxLength={500}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 6,
              padding: '7px 10px', color: '#F0F0F8',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none',
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
              border: 'none', borderRadius: 6, padding: '7px 16px',
              color: canSend ? '#0A0A0F' : 'rgba(201,169,97,0.3)',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              fontWeight: 700, letterSpacing: '0.06em',
              cursor: canSend ? 'pointer' : 'not-allowed',
              transition: 'background 150ms, color 150ms', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {sending ? '…' : 'SEND'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ChatBar ──────────────────────────────────────────────────────────────

export default function ChatBar() {
  const { user }                          = usePantheonWars()
  const {
    isOpen, setIsOpen,
    activeTab, setActiveTab,
    messages, unread, sendMessage,
    threadsList, totalDmUnread,
    activeThreadId, setActiveThreadId,
    threadMessages,
    dmView, setDmView,
    composeUsername, setComposeUsername,
    openThread, openDmWithUser, sendDm, fetchThreadsList,
  } = useChat()

  const [input, setInput]     = useState('')
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [toast, setToast]     = useState(null)
  const inputRef = useRef(null)
  const listRef  = useRef(null)

  if (!user) return null

  const totalUnread = (unread.general || 0) + (unread.dm || 0)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  function handleUsernameClick(senderId, senderUsername) {
    if (senderUsername === user.username) return
    openDmWithUser(senderId, senderUsername)
  }

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return

    // /w command — works from any tab's general input
    const dmMatch = content.match(/^\/w\s+(\S+)\s+(.+)$/s)
    if (dmMatch) {
      const [, targetUsername, message] = dmMatch
      setSending(true)
      setErrorMsg(null)
      try {
        const data = await sendDm(targetUsername, message.trim())
        if (data.ok) {
          setInput('')
          setActiveTab('private')
          setIsOpen(true)
          openThread(data.thread_id)
          fetchThreadsList()
        } else {
          setErrorMsg(data.message || 'DM failed.')
        }
      } catch {
        setErrorMsg('Network error.')
      } finally {
        setSending(false)
        inputRef.current?.focus()
      }
      return
    }

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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const canSend = input.trim().length > 0 && !sending

  // Resolved active thread info
  const activeThread = activeThreadId != null
    ? threadsList.find(t => t.thread_id === activeThreadId) || null
    : null
  const activeMessages = activeThreadId != null
    ? (threadMessages[activeThreadId] || [])
    : []

  // DM tab badge: use totalDmUnread from threadsList + raw unread.dm for Pusher increments
  const dmBadge = Math.max(totalDmUnread, unread.dm || 0)

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 25, background: BG,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderTop: `1px solid ${BORDER}`,
    }}>
      {/* Toast */}
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
              borderRadius: 6, padding: '6px 14px',
              color: GOLD_DIM, fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11, whiteSpace: 'nowrap', marginBottom: 6, pointerEvents: 'none',
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
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD_DIM,
            }}>
              {activeTab === 'general' ? 'GENERAL CHAT' : activeTab === 'private' ? 'MESSAGES' : 'MOD CHAT'}
            </span>
            {totalUnread > 0 && (
              <span style={{
                background: GOLD, color: '#0A0A0F', borderRadius: 8,
                padding: '1px 6px', fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, fontWeight: 700, lineHeight: 1.6,
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
            {/* Tab bar + collapse button */}
            <div style={{
              display: 'flex', alignItems: 'stretch',
              borderBottom: `1px solid ${BORDER}`,
              height: 36, flexShrink: 0,
            }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    // Reset DM view when re-entering private tab
                    if (tab.id === 'private' && activeTab !== 'private') {
                      setDmView('list')
                      setActiveThreadId(null)
                      setComposeUsername('')
                    }
                  }}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : '2px solid transparent',
                    padding: '0 16px', cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.35)',
                    transition: 'color 120ms, border-color 120ms',
                    display: 'flex', alignItems: 'center', gap: 6, position: 'relative',
                  }}
                >
                  {tab.label}
                  {tab.id === 'general' && unread.general > 0 && (
                    <span style={{
                      background: GOLD, color: '#0A0A0F', borderRadius: 6,
                      padding: '1px 5px', fontSize: 8, fontWeight: 700, lineHeight: 1.6,
                    }}>
                      {unread.general}
                    </span>
                  )}
                  {tab.id === 'private' && dmBadge > 0 && (
                    <span style={{
                      background: GOLD, color: '#0A0A0F', borderRadius: 6,
                      padding: '1px 5px', fontSize: 8, fontWeight: 700, lineHeight: 1.6,
                    }}>
                      {dmBadge}
                    </span>
                  )}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Collapse chat"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: GOLD_MUT, padding: '0 14px', fontSize: 13,
                  transition: 'color 120ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = GOLD_DIM }}
                onMouseLeave={e => { e.currentTarget.style.color = GOLD_MUT }}
              >
                ▼
              </button>
            </div>

            {/* Content area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

              {/* ── GENERAL TAB ── */}
              {activeTab === 'general' && (
                <>
                  <MessageList
                    messages={messages.general}
                    onUsernameClick={handleUsernameClick}
                    listRef={listRef}
                  />
                  <div style={{
                    display: 'flex', gap: 8, padding: '8px 12px',
                    borderTop: `1px solid ${BORDER}`,
                    flexShrink: 0, position: 'relative',
                  }}>
                    {errorMsg && (
                      <div style={{
                        position: 'absolute', bottom: '100%', left: 12,
                        background: 'rgba(220,50,50,0.15)',
                        border: '1px solid rgba(220,50,50,0.3)',
                        borderRadius: 4, padding: '4px 10px',
                        color: 'rgba(255,100,100,0.9)',
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, marginBottom: 4,
                      }}>
                        {errorMsg}
                      </div>
                    )}
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => { setInput(e.target.value); setErrorMsg(null) }}
                      onKeyDown={handleKeyDown}
                      placeholder="Message general chat… (or /w username msg)"
                      maxLength={500}
                      style={{
                        flex: 1, background: 'rgba(255,255,255,0.05)',
                        border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 6,
                        padding: '7px 10px', color: '#F0F0F8',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none',
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
                        border: 'none', borderRadius: 6, padding: '7px 16px',
                        color: canSend ? '#0A0A0F' : 'rgba(201,169,97,0.3)',
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                        fontWeight: 700, letterSpacing: '0.06em',
                        cursor: canSend ? 'pointer' : 'not-allowed',
                        transition: 'background 150ms, color 150ms',
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      {sending ? '…' : 'SEND'}
                    </button>
                  </div>
                </>
              )}

              {/* ── PRIVATE TAB ── */}
              {activeTab === 'private' && dmView === 'list' && (
                <DmThreadList
                  threads={threadsList}
                  onOpen={openThread}
                  onCompose={() => {
                    setComposeUsername('')
                    setDmView('compose')
                    setActiveThreadId(null)
                  }}
                />
              )}
              {activeTab === 'private' && dmView === 'thread' && (
                <DmThreadView
                  thread={activeThread}
                  messages={activeMessages}
                  currentUserId={user.id}
                  sendDm={sendDm}
                  fetchThreadsList={fetchThreadsList}
                  onBack={() => {
                    setDmView('list')
                    setActiveThreadId(null)
                    fetchThreadsList()
                  }}
                />
              )}
              {activeTab === 'private' && dmView === 'compose' && (
                <DmComposeView
                  initialUsername={composeUsername}
                  currentUserId={user.id}
                  sendDm={sendDm}
                  fetchThreadsList={fetchThreadsList}
                  onBack={() => {
                    setDmView('list')
                    setComposeUsername('')
                  }}
                  onThreadOpened={(thread_id) => {
                    setComposeUsername('')
                    openThread(thread_id)
                  }}
                />
              )}

              {/* ── MOD TAB ── */}
              {activeTab === 'mod' && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  color: 'rgba(255,255,255,0.3)',
                }}>
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                    letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD_MUT,
                  }}>
                    MOD CHAT
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                    Coming soon
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

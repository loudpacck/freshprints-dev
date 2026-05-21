import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import Pusher from 'pusher-js'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

const ChatContext = createContext(null)
export const useChat = () => useContext(ChatContext)

const API = '/api/games/pantheon-wars/game'

export function ChatProvider({ children }) {
  const { user } = usePantheonWars()

  const [isOpen, setIsOpen]       = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [messages, setMessages]   = useState({ general: [], mod: [] })
  const [unread, setUnread]       = useState({ general: 0, dm: 0, mod: 0 })

  // Mod identity
  const [isMod, setIsMod]               = useState(false)
  const [modUsername, setModUsername]   = useState(null)
  const [modShowBadge, setModShowBadge] = useState(true)

  // DM state
  const [threadsList, setThreadsList]         = useState([])
  const [activeThreadId, setActiveThreadId]   = useState(null)
  const [threadMessages, setThreadMessages]   = useState({})
  const [dmView, setDmView]                   = useState('list')
  const [composeUsername, setComposeUsername] = useState('')

  // Stable refs for Pusher callbacks
  const isOpenRef         = useRef(isOpen)
  const activeTabRef      = useRef(activeTab)
  const activeThreadIdRef = useRef(activeThreadId)
  const threadsListRef    = useRef(threadsList)

  useEffect(() => { isOpenRef.current = isOpen },               [isOpen])
  useEffect(() => { activeTabRef.current = activeTab },         [activeTab])
  useEffect(() => { activeThreadIdRef.current = activeThreadId }, [activeThreadId])
  useEffect(() => { threadsListRef.current = threadsList },     [threadsList])

  const totalDmUnread = threadsList.reduce((sum, t) => sum + (t.unread_count || 0), 0)

  // Initial data fetch: general history + mod state
  useEffect(() => {
    if (!user) return

    fetch(`${API}?action=chat_fetch&channel=general`)
      .then(r => r.json())
      .then(data => { if (data.ok) setMessages(prev => ({ ...prev, general: data.messages })) })
      .catch(() => {})

    fetch(`${API}?action=chat_state`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.isMod) {
          setIsMod(true)
          setModUsername(data.modUsername)
          setModShowBadge(data.modShowBadge)
          fetch(`${API}?action=chat_mod_fetch`)
            .then(r => r.json())
            .then(d => { if (d.ok) setMessages(prev => ({ ...prev, mod: d.messages })) })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [user?.id])

  // DM threads
  const fetchThreadsList = useCallback(() => {
    fetch(`${API}?action=chat_dm_threads`)
      .then(r => r.json())
      .then(data => { if (data.ok) setThreadsList(data.threads) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user) fetchThreadsList()
  }, [user?.id, fetchThreadsList])

  const openThread = useCallback((thread_id) => {
    setActiveThreadId(thread_id)
    setDmView('thread')
    setComposeUsername('')
    setThreadsList(prev => prev.map(t => t.thread_id === thread_id ? { ...t, unread_count: 0 } : t))
    fetch(`${API}?action=chat_dm_fetch&thread_id=${thread_id}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setThreadMessages(prev => ({ ...prev, [thread_id]: data.messages }))
      })
      .catch(() => {})
  }, [])

  const openDmWithUser = useCallback((userId, username) => {
    setActiveTab('private')
    setIsOpen(true)
    const existing = threadsListRef.current.find(t => t.other_user_id === userId)
    if (existing) {
      openThread(existing.thread_id)
    } else {
      setActiveThreadId(null)
      setComposeUsername(username)
      setDmView('compose')
    }
  }, [openThread])

  // Pusher — recreates client when isMod changes to add private-mod subscription
  useEffect(() => {
    if (!user) return

    const client = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster:      import.meta.env.VITE_PUSHER_CLUSTER,
      authEndpoint: `${API}?action=chat_pusher_auth`,
    })

    const generalChannel = client.subscribe('general')
    generalChannel.bind('new_message', (msg) => {
      setMessages(prev => ({ ...prev, general: [...prev.general, msg].slice(-100) }))
      if (!isOpenRef.current || activeTabRef.current !== 'general') {
        setUnread(prev => ({ ...prev, general: prev.general + 1 }))
      }
    })
    generalChannel.bind('message_deleted', ({ id }) => {
      setMessages(prev => ({
        ...prev,
        general: prev.general.filter(m => Number(m.id) !== Number(id)),
      }))
    })

    const userChannel = client.subscribe(`private-user-${user.id}`)
    userChannel.bind('dm_message', (msg) => {
      setThreadMessages(prev => ({
        ...prev,
        [msg.thread_id]: [...(prev[msg.thread_id] || []), msg],
      }))
      fetch(`${API}?action=chat_dm_threads`)
        .then(r => r.json())
        .then(data => { if (data.ok) setThreadsList(data.threads) })
        .catch(() => {})
      const viewingThisThread =
        isOpenRef.current &&
        activeTabRef.current === 'private' &&
        activeThreadIdRef.current === msg.thread_id
      if (!viewingThisThread) {
        setUnread(prev => ({ ...prev, dm: (prev.dm || 0) + 1 }))
      }
    })
    userChannel.bind('dm_message_deleted', ({ id, thread_id }) => {
      if (thread_id != null) {
        setThreadMessages(prev => ({
          ...prev,
          [thread_id]: (prev[thread_id] || []).filter(m => Number(m.id) !== Number(id)),
        }))
      }
    })

    if (isMod) {
      const modChannel = client.subscribe('private-mod')
      modChannel.bind('new_message', (msg) => {
        setMessages(prev => ({ ...prev, mod: [...(prev.mod || []), msg].slice(-100) }))
        if (!isOpenRef.current || activeTabRef.current !== 'mod') {
          setUnread(prev => ({ ...prev, mod: (prev.mod || 0) + 1 }))
        }
      })
      modChannel.bind('message_deleted', ({ id }) => {
        setMessages(prev => ({
          ...prev,
          mod: (prev.mod || []).filter(m => Number(m.id) !== Number(id)),
        }))
      })
    }

    return () => { client.disconnect() }
  }, [user?.id, isMod])

  // Clear unread when tab is active + open
  useEffect(() => {
    if (!isOpen) return
    if (activeTab === 'private') {
      setUnread(prev => ({ ...prev, dm: 0 }))
    } else {
      setUnread(prev => ({ ...prev, [activeTab]: 0 }))
    }
  }, [isOpen, activeTab])

  // ── Actions ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (channel, content) => {
    const res = await fetch(`${API}?action=chat_send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, content }),
    })
    return res.json()
  }, [])

  const sendDm = useCallback(async (target_username, content) => {
    const res = await fetch(`${API}?action=chat_dm_send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_username, content }),
    })
    return res.json()
  }, [])

  const sendModMessage = useCallback(async (content) => {
    const res = await fetch(`${API}?action=chat_mod_send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    return res.json()
  }, [])

  const moderateMessage = useCallback(async (action, params) => {
    const res = await fetch(`${API}?action=chat_moderate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    })
    return res.json()
  }, [])

  const liftModeration = useCallback(async (moderation_id) => {
    const res = await fetch(`${API}?action=chat_lift_moderation`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moderation_id }),
    })
    return res.json()
  }, [])

  const listModerations = useCallback(async (scope = 'active') => {
    const res = await fetch(`${API}?action=chat_list_moderations&scope=${scope}`)
    return res.json()
  }, [])

  const updateModBadge = useCallback(async (show_badge) => {
    const res = await fetch(`${API}?action=chat_set_mod_badge`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ show_badge }),
    })
    const data = await res.json()
    if (data.ok) setModShowBadge(data.show_badge)
    return data
  }, [])

  return (
    <ChatContext.Provider value={{
      isOpen, setIsOpen,
      activeTab, setActiveTab,
      messages, unread, sendMessage,
      isMod, modUsername, modShowBadge,
      sendModMessage, moderateMessage, liftModeration, listModerations, updateModBadge,
      threadsList, totalDmUnread,
      activeThreadId, setActiveThreadId,
      threadMessages, setThreadMessages,
      dmView, setDmView,
      composeUsername, setComposeUsername,
      openThread, openDmWithUser, sendDm, fetchThreadsList,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

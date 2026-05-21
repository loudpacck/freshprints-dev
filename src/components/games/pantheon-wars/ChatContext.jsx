import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import Pusher from 'pusher-js'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

const ChatContext = createContext(null)
export const useChat = () => useContext(ChatContext)

export function ChatProvider({ children }) {
  const { user } = usePantheonWars()

  // General chat
  const [isOpen, setIsOpen]       = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [messages, setMessages]   = useState({ general: [] })
  const [unread, setUnread]       = useState({ general: 0, dm: 0 })

  // DM state
  const [threadsList, setThreadsList]         = useState([])
  const [activeThreadId, setActiveThreadId]   = useState(null)  // number | null
  const [threadMessages, setThreadMessages]   = useState({})    // { [thread_id]: Message[] }
  const [dmView, setDmView]                   = useState('list') // 'list' | 'thread' | 'compose'
  const [composeUsername, setComposeUsername] = useState('')

  // Refs for stable Pusher callbacks
  const isOpenRef         = useRef(isOpen)
  const activeTabRef      = useRef(activeTab)
  const activeThreadIdRef = useRef(activeThreadId)
  const threadsListRef    = useRef(threadsList)

  useEffect(() => { isOpenRef.current = isOpen },               [isOpen])
  useEffect(() => { activeTabRef.current = activeTab },         [activeTab])
  useEffect(() => { activeThreadIdRef.current = activeThreadId }, [activeThreadId])
  useEffect(() => { threadsListRef.current = threadsList },     [threadsList])

  const totalDmUnread = threadsList.reduce((sum, t) => sum + (t.unread_count || 0), 0)

  // Fetch general chat history
  useEffect(() => {
    if (!user) return
    fetch('/api/games/pantheon-wars/game?action=chat_fetch&channel=general')
      .then(r => r.json())
      .then(data => { if (data.ok) setMessages(prev => ({ ...prev, general: data.messages })) })
      .catch(() => {})
  }, [user?.id])

  // Fetch DM threads list
  const fetchThreadsList = useCallback(() => {
    fetch('/api/games/pantheon-wars/game?action=chat_dm_threads')
      .then(r => r.json())
      .then(data => { if (data.ok) setThreadsList(data.threads) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user) fetchThreadsList()
  }, [user?.id, fetchThreadsList])

  // Open a DM thread (fetches messages, marks read server-side)
  const openThread = useCallback((thread_id) => {
    setActiveThreadId(thread_id)
    setDmView('thread')
    setComposeUsername('')
    // Optimistic unread clear
    setThreadsList(prev => prev.map(t => t.thread_id === thread_id ? { ...t, unread_count: 0 } : t))
    fetch(`/api/games/pantheon-wars/game?action=chat_dm_fetch&thread_id=${thread_id}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setThreadMessages(prev => ({ ...prev, [thread_id]: data.messages }))
      })
      .catch(() => {})
  }, [])

  // Navigate to DM with a specific user (from General chat username click)
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

  // Pusher subscriptions
  useEffect(() => {
    if (!user) return

    const client = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster:      import.meta.env.VITE_PUSHER_CLUSTER,
      authEndpoint: '/api/games/pantheon-wars/game?action=chat_pusher_auth',
    })

    const generalChannel = client.subscribe('general')
    generalChannel.bind('new_message', (msg) => {
      setMessages(prev => ({
        ...prev,
        general: [...prev.general, msg].slice(-100),
      }))
      if (!isOpenRef.current || activeTabRef.current !== 'general') {
        setUnread(prev => ({ ...prev, general: prev.general + 1 }))
      }
    })

    const userChannel = client.subscribe(`private-user-${user.id}`)
    userChannel.bind('dm_message', (msg) => {
      setThreadMessages(prev => ({
        ...prev,
        [msg.thread_id]: [...(prev[msg.thread_id] || []), msg],
      }))
      // Refresh thread list (unread counts, last preview)
      fetch('/api/games/pantheon-wars/game?action=chat_dm_threads')
        .then(r => r.json())
        .then(data => { if (data.ok) setThreadsList(data.threads) })
        .catch(() => {})
      // Increment DM unread badge if not currently viewing this thread
      const viewingThisThread =
        isOpenRef.current &&
        activeTabRef.current === 'private' &&
        activeThreadIdRef.current === msg.thread_id
      if (!viewingThisThread) {
        setUnread(prev => ({ ...prev, dm: (prev.dm || 0) + 1 }))
      }
    })

    return () => {
      client.unsubscribe('general')
      client.unsubscribe(`private-user-${user.id}`)
      client.disconnect()
    }
  }, [user?.id])

  // Clear general unread when tab opens (DM unread managed via threadsList)
  useEffect(() => {
    if (isOpen && activeTab !== 'private') {
      setUnread(prev => ({ ...prev, [activeTab]: 0 }))
    }
    if (isOpen && activeTab === 'private') {
      setUnread(prev => ({ ...prev, dm: 0 }))
    }
  }, [isOpen, activeTab])

  const sendMessage = useCallback(async (channel, content) => {
    const res = await fetch('/api/games/pantheon-wars/game?action=chat_send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ channel, content }),
    })
    return res.json()
  }, [])

  const sendDm = useCallback(async (target_username, content) => {
    const res = await fetch('/api/games/pantheon-wars/game?action=chat_dm_send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ target_username, content }),
    })
    return res.json()
  }, [])

  return (
    <ChatContext.Provider value={{
      isOpen, setIsOpen,
      activeTab, setActiveTab,
      messages, unread, sendMessage,
      // DM
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

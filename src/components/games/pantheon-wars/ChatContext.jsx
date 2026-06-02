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
  const [messages, setMessages]   = useState({ general: [], mod: [], alliance: [] })
  const [unread, setUnread]       = useState({ general: 0, dm: 0, mod: 0, alliance: 0 })

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

  // Alliance state — driven by chat_state (alliance_id/name/tag) + alliance_info (rank).
  // The ALLIANCE tab is shown only when allianceId is non-null. allianceRank gates the
  // founder/officer delete affordance (the backend independently enforces permission).
  const [allianceId, setAllianceId]     = useState(null)
  const [allianceName, setAllianceName] = useState(null)
  const [allianceTag, setAllianceTag]   = useState(null)
  const [allianceRank, setAllianceRank] = useState(null)
  const modFetchedRef = useRef(false)

  // Stable refs for Pusher callbacks
  const isOpenRef         = useRef(isOpen)
  const activeTabRef      = useRef(activeTab)
  const activeThreadIdRef = useRef(activeThreadId)
  const threadsListRef    = useRef(threadsList)
  const allianceNameRef   = useRef(allianceName)  // last-known name for membership toasts

  useEffect(() => { isOpenRef.current = isOpen },               [isOpen])
  useEffect(() => { activeTabRef.current = activeTab },         [activeTab])
  useEffect(() => { activeThreadIdRef.current = activeThreadId }, [activeThreadId])
  useEffect(() => { threadsListRef.current = threadsList },     [threadsList])
  useEffect(() => { allianceNameRef.current = allianceName },   [allianceName])

  const totalDmUnread = threadsList.reduce((sum, t) => sum + (t.unread_count || 0), 0)

  // Pull the latest mod identity + alliance membership from the backend. Called on
  // mount and whenever alliance membership changes (via the fp-alliance-changed event).
  // Backend action is `chat_state` (the spec's "chat_init"); it returns alliance_id/
  // name/tag but NOT rank, so rank is fetched separately from alliance_info for the
  // delete affordance only.
  const refreshChatState = useCallback(() => {
    return fetch(`${API}?action=chat_state`)
      .then(r => r.json())
      .then(data => {
        if (!data.ok) return

        if (data.isMod) {
          setIsMod(true)
          setModUsername(data.modUsername)
          setModShowBadge(data.modShowBadge)
          if (!modFetchedRef.current) {
            modFetchedRef.current = true
            fetch(`${API}?action=chat_mod_fetch`)
              .then(r => r.json())
              .then(d => { if (d.ok) setMessages(prev => ({ ...prev, mod: d.messages })) })
              .catch(() => {})
          }
        }

        const aid = data.alliance_id || null
        setAllianceId(aid)
        setAllianceName(data.alliance_name || null)
        setAllianceTag(data.alliance_tag || null)
        if (aid) {
          fetch(`${API}?action=alliance_info`)
            .then(r => r.json())
            .then(d => setAllianceRank(d?.member?.rank || null))
            .catch(() => setAllianceRank(null))
        } else {
          setAllianceRank(null)
          setMessages(prev => ({ ...prev, alliance: [] }))
          setUnread(prev => ({ ...prev, alliance: 0 }))
        }
      })
      .catch(() => {})
  }, [])

  const fetchAllianceMessages = useCallback(() => {
    return fetch(`${API}?action=chat_fetch&channel=alliance`)
      .then(r => r.json())
      .then(data => { if (data.ok) setMessages(prev => ({ ...prev, alliance: data.messages })) })
      .catch(() => {})
  }, [])

  // Initial data fetch: general history + mod/alliance state
  useEffect(() => {
    if (!user) return
    modFetchedRef.current = false

    fetch(`${API}?action=chat_fetch&channel=general`)
      .then(r => r.json())
      .then(data => { if (data.ok) setMessages(prev => ({ ...prev, general: data.messages })) })
      .catch(() => {})

    refreshChatState()
  }, [user?.id, refreshChatState])

  // Load alliance history (last 100, oldest first) whenever the alliance changes.
  useEffect(() => {
    if (allianceId) fetchAllianceMessages()
  }, [allianceId, fetchAllianceMessages])

  // React to membership changes triggered elsewhere (Alliance page join/leave/disband).
  useEffect(() => {
    if (!user) return
    const handler = () => refreshChatState()
    window.addEventListener('fp-alliance-changed', handler)
    return () => window.removeEventListener('fp-alliance-changed', handler)
  }, [user?.id, refreshChatState])

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

    // Phase F — someone else changed our alliance standing. Re-sync chat membership
    // (tabs/rank) and re-broadcast as a window event so the shell-wide ChatBar can
    // toast and a mounted Alliance page can re-fetch. We attach the last-known alliance
    // name (the server payload carries only ids) for friendlier kicked/disbanded copy.
    userChannel.bind('alliance_membership_changed', (payload) => {
      const detail = { ...payload, alliance_name: allianceNameRef.current }
      refreshChatState()
      window.dispatchEvent(new CustomEvent('fp-alliance-membership-changed', { detail }))
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

    // Alliance channel — subscribed only while the player is in an alliance. When
    // allianceId clears (leave/kick/disband), this effect re-runs and the new client
    // omits the subscription, so the old channel is dropped on disconnect.
    if (allianceId) {
      const allianceChannel = client.subscribe(`private-alliance-${allianceId}`)
      allianceChannel.bind('new_message', (msg) => {
        setMessages(prev => ({ ...prev, alliance: [...(prev.alliance || []), msg].slice(-100) }))
        if (!isOpenRef.current || activeTabRef.current !== 'alliance') {
          setUnread(prev => ({ ...prev, alliance: (prev.alliance || 0) + 1 }))
        }
      })
      // Tombstone (don't remove): mark the matching message deleted. The deleter's name
      // arrives via a follow-up system new_message and backfills on the next fetch.
      allianceChannel.bind('message_deleted', ({ id }) => {
        setMessages(prev => ({
          ...prev,
          alliance: (prev.alliance || []).map(m =>
            Number(m.id) === Number(id)
              ? { ...m, deleted_at: m.deleted_at || new Date().toISOString() }
              : m
          ),
        }))
      })
    }

    return () => { client.disconnect() }
  }, [user?.id, isMod, allianceId])

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

  // Alliance send/delete. Backend uses the `channel` param (not channel_type); the
  // server scopes the message to the caller's current alliance.
  const sendAllianceMessage = useCallback(async (content) => {
    const res = await fetch(`${API}?action=chat_send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'alliance', content }),
    })
    return res.json()
  }, [])

  const deleteAllianceMessage = useCallback(async (message_id) => {
    const res = await fetch(`${API}?action=chat_alliance_delete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id }),
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
      allianceId, allianceName, allianceTag, allianceRank,
      sendAllianceMessage, deleteAllianceMessage, fetchAllianceMessages, refreshChatState,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

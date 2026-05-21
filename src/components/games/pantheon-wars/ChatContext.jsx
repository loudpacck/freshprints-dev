import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import Pusher from 'pusher-js'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

const ChatContext = createContext(null)
export const useChat = () => useContext(ChatContext)

export function ChatProvider({ children }) {
  const { user } = usePantheonWars()
  const [isOpen, setIsOpen]       = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [messages, setMessages]   = useState({ general: [] })
  const [unread, setUnread]       = useState({ general: 0, dm: 0 })
  const isOpenRef  = useRef(isOpen)
  const activeTabRef = useRef(activeTab)

  useEffect(() => { isOpenRef.current = isOpen },   [isOpen])
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])

  // Fetch initial history
  useEffect(() => {
    if (!user) return
    fetch('/api/games/pantheon-wars/game?action=chat_fetch&channel=general')
      .then(r => r.json())
      .then(data => {
        if (data.ok) setMessages(prev => ({ ...prev, general: data.messages }))
      })
      .catch(() => {})
  }, [user?.id])

  // Pusher subscription
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

    return () => {
      client.unsubscribe('general')
      client.disconnect()
    }
  }, [user?.id])

  // Clear unread when tab opens
  useEffect(() => {
    if (isOpen) setUnread(prev => ({ ...prev, [activeTab]: 0 }))
  }, [isOpen, activeTab])

  const sendMessage = useCallback(async (channel, content) => {
    const res = await fetch('/api/games/pantheon-wars/game?action=chat_send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ channel, content }),
    })
    return res.json()
  }, [])

  return (
    <ChatContext.Provider value={{
      isOpen, setIsOpen,
      activeTab, setActiveTab,
      messages, unread, sendMessage,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

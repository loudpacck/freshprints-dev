import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import TownshipTopBar from '@/components/games/pantheon-wars/township/TownshipTopBar'
import TownshipScene  from '@/components/games/pantheon-wars/township/TownshipScene'
import BuildingModal  from '@/components/games/pantheon-wars/township/BuildingModal'
import {
  FACTION_MAP,
  FACTION_LOADING_MSG,
  gatherPreloadAssets,
  preloadImages,
} from '@/components/games/pantheon-wars/township/townshipConfig'

const WELCOME_MSGS = {
  greek: 'Welcome to your settlement, child of Olympus. Establish your first profession to begin building.',
  norse: 'Hail, kinsman of the Aesir. Your land awaits. Forge your first profession to raise these grounds.',
  mesop: 'The gods of Sumer smile upon you. Establish your first profession to awaken this domain.',
}

function LoadingScreen({ assetKey }) {
  const msg = FACTION_LOADING_MSG[assetKey] || 'Loading your settlement...'
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A0710',
      gap: 20,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: '2px solid rgba(201,169,97,0.15)',
        borderTopColor: '#C9A961',
        animation: 'tw-spin 0.9s linear infinite',
      }} />
      <p style={{
        fontFamily: "'Cinzel', serif",
        fontSize: 14,
        letterSpacing: '0.14em',
        color: 'rgba(237,227,204,0.7)',
        margin: 0,
        textAlign: 'center',
        padding: '0 24px',
      }}>
        {msg}
      </p>
      <style>{`@keyframes tw-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ErrorScreen({ onRetry }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A0710',
      gap: 18,
      padding: '0 24px',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: "'Cinzel', serif",
        fontSize: 15,
        letterSpacing: '0.12em',
        color: '#EDC87C',
        margin: 0,
      }}>
        FAILED TO LOAD TOWNSHIP
      </p>
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        color: 'rgba(237,227,204,0.4)',
        margin: 0,
        maxWidth: 340,
        lineHeight: 1.6,
      }}>
        Could not connect to the settlement servers. Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        style={{
          marginTop: 8,
          background: 'transparent',
          border: '1px solid rgba(201,169,97,0.45)',
          borderRadius: 6,
          color: '#C9A961',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.14em',
          padding: '8px 24px',
          cursor: 'pointer',
          transition: 'border-color 150ms, color 150ms',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(201,169,97,0.8)'
          e.currentTarget.style.color = '#EDE3CC'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(201,169,97,0.45)'
          e.currentTarget.style.color = '#C9A961'
        }}
      >
        RETRY
      </button>
    </div>
  )
}

function WelcomeOverlay({ assetKey, onExplore, onGoToDashboard }) {
  const btnBase = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.14em',
    borderRadius: 6,
    padding: '10px 22px',
    cursor: 'pointer',
    transition: 'all 150ms',
    whiteSpace: 'nowrap',
  }
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 300,
      background: 'rgba(5,3,14,0.78)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #100C1F 0%, #0C0915 100%)',
        border: '1px solid rgba(201,169,97,0.28)',
        borderRadius: 8,
        padding: '36px 40px',
        maxWidth: 460,
        width: '90%',
        textAlign: 'center',
      }}>
        <p style={{
          margin: '0 0 10px',
          fontFamily: "'Cinzel', serif",
          fontSize: 11,
          letterSpacing: '0.18em',
          color: 'rgba(201,169,97,0.55)',
          textTransform: 'uppercase',
        }}>
          YOUR SETTLEMENT AWAITS
        </p>
        <p style={{
          margin: '0 0 28px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          lineHeight: 1.7,
          color: 'rgba(237,227,204,0.65)',
        }}>
          {WELCOME_MSGS[assetKey] || WELCOME_MSGS.greek}
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onExplore}
            style={{
              ...btnBase,
              background: 'transparent',
              border: '1px solid rgba(201,169,97,0.35)',
              color: '#C9A961',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(201,169,97,0.7)'
              e.currentTarget.style.color = '#EDE3CC'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(201,169,97,0.35)'
              e.currentTarget.style.color = '#C9A961'
            }}
          >
            EXPLORE
          </button>
          <button
            onClick={onGoToDashboard}
            style={{
              ...btnBase,
              background: 'rgba(201,169,97,0.12)',
              border: '1px solid rgba(201,169,97,0.55)',
              color: '#EDC87C',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(201,169,97,0.2)'
              e.currentTarget.style.color = '#F5E0A4'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(201,169,97,0.12)'
              e.currentTarget.style.color = '#EDC87C'
            }}
          >
            GO TO DASHBOARD
          </button>
        </div>
      </div>
    </div>
  )
}

function TempleWarningToast({ onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position: 'fixed',
      bottom: 68,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 500,
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.35)',
      borderRadius: 6,
      padding: '8px 18px',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 11,
      letterSpacing: '0.08em',
      color: '#F59E0B',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    }}>
      Temple data unavailable
    </div>
  )
}

export default function TownshipView() {
  const { user, loading: authLoading } = usePantheonWars()
  const navigate = useNavigate()

  const [townships,        setTownships]        = useState(null)
  const [templeData,       setTempleData]        = useState(null)
  const [sceneReady,       setSceneReady]        = useState(false)
  const [selectedBuilding, setSelectedBuilding]  = useState(null)
  const [townshipError,    setTownshipError]     = useState(false)
  const [templeWarning,    setTempleWarning]     = useState(false)
  const [showWelcome,      setShowWelcome]       = useState(false)
  const [loadKey,          setLoadKey]           = useState(0)
  const [layoutConfig,     setLayoutConfig]      = useState(null)

  // Admin-configured layout overrides — separate fetch, silent fallback to defaults
  useEffect(() => {
    fetch('/api/admin/overview?action=get_config&key=township_layout')
      .then(r => r.json())
      .then(({ config }) => { if (config) setLayoutConfig(config) })
      .catch(() => {})
  }, [])

  const assetKey = FACTION_MAP[user?.faction] || 'greek'

  function handleBuildingClick(plotId) {
    if (plotId === 'shop') {
      navigate('/games/pantheon-wars/shop')
      return
    }
    setSelectedBuilding(plotId)
  }

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/games/pantheon-wars/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  // Fetch township + temple data then preload assets
  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function load() {
      setTownshipError(false)
      setTempleWarning(false)
      setSceneReady(false)

      let tw = null
      let tp = null

      // Township fetch — hard failure if this fails
      try {
        const twRes = await fetch('/api/games/pantheon-wars/game?action=township')
        if (!twRes.ok) throw new Error()
        const twData = await twRes.json()
        if (cancelled) return
        tw = twData.townships || []
        setTownships(tw)
      } catch {
        if (!cancelled) setTownshipError(true)
        return
      }

      // Temple fetch — soft failure; scene still renders
      try {
        const tpRes = await fetch('/api/games/pantheon-wars/game?action=temples')
        if (!tpRes.ok) throw new Error()
        const tpData = await tpRes.json()
        if (cancelled) return
        tp = tpData || {}
        setTempleData(tp)
      } catch {
        if (!cancelled) {
          setTempleWarning(true)
          tp = { owned: [] }
          setTempleData(tp)
        }
      }

      if (cancelled) return

      // New player welcome: 0 professions AND 0 temples, shown once per session
      const hasNoProfessions = (tw || []).filter(t => t.is_owned).length === 0
      const hasNoTemples     = (tp?.owned || []).length === 0
      if (hasNoProfessions && hasNoTemples && !sessionStorage.getItem('tw-welcome-shown')) {
        setShowWelcome(true)
      }

      const srcs = gatherPreloadAssets(assetKey, tw, tp)
      await preloadImages(srcs)

      if (!cancelled) setSceneReady(true)
    }

    load()
    return () => { cancelled = true }
  }, [user?.id, assetKey, loadKey]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDismissWelcome() {
    sessionStorage.setItem('tw-welcome-shown', '1')
    setShowWelcome(false)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      overflow: 'hidden',
      background: '#0A0710',
    }}>
      <TownshipTopBar
        townships={townships}
        templeData={templeData}
      />

      {townshipError ? (
        <ErrorScreen onRetry={() => setLoadKey(k => k + 1)} />
      ) : !sceneReady ? (
        <LoadingScreen assetKey={assetKey} />
      ) : (
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TownshipScene
            faction={user?.faction}
            townships={townships}
            templeData={templeData}
            onBuildingClick={handleBuildingClick}
            isModalOpen={!!selectedBuilding}
            plotOverrides={layoutConfig?.plots}
            npcOverrides={layoutConfig?.npcs}
            atmosphereOverrides={layoutConfig?.atmosphere}
            playerFootOffsetOverride={layoutConfig?.player?.footOffsetPx?.[assetKey]}
          />
          {showWelcome && (
            <WelcomeOverlay
              assetKey={assetKey}
              onExplore={handleDismissWelcome}
              onGoToDashboard={() => { handleDismissWelcome(); navigate('/games/pantheon-wars') }}
            />
          )}
        </div>
      )}

      {templeWarning && (
        <TempleWarningToast onDismiss={() => setTempleWarning(false)} />
      )}

      <BuildingModal
        plotId={selectedBuilding}
        assetKey={assetKey}
        townships={townships}
        templeData={templeData}
        onClose={() => setSelectedBuilding(null)}
      />
    </div>
  )
}

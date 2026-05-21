import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import PageChrome from '@/components/layout/PageChrome'
import SoundToggle from '@/components/layout/SoundToggle'
import Terminal from '@/components/terminal/Terminal'
import LoadingDot from '@/components/ui/LoadingDot'
import { useTerminal } from '@/hooks/useTerminal'
import { ThemeProvider, useTheme } from '@/themes/ThemeProvider'
import DevThemeSwitcher from '@/components/dev/DevThemeSwitcher'
import AutoTrackers from '@/tracking/AutoTrackers'
import { PantheonWarsProvider } from '@/contexts/PantheonWarsContext'
import { ChatProvider } from '@/components/games/pantheon-wars/ChatContext'
import ChatBar from '@/components/games/pantheon-wars/ChatBar'
import { soundManager } from '@/sound/SoundManager'
import { musicManager } from '@/sound/MusicManager'
import { ambienceManager } from '@/sound/AmbienceManager'
import PWTitleCardSequence from '@/components/games/pantheon-wars/PWTitleCardSequence'
import StandardLayout from '@/components/standard/StandardLayout'
import RetroLayout from '@/components/retro/RetroLayout'

const Landing         = lazy(() => import('@/pages/Landing'))
const StandardLanding = lazy(() => import('@/pages/StandardLanding'))
const RetroLanding    = lazy(() => import('@/pages/RetroLanding'))
const Hub             = lazy(() => import('@/pages/Hub'))
const About           = lazy(() => import('@/pages/About'))
const Portfolio       = lazy(() => import('@/pages/Portfolio'))
const ProjectPage     = lazy(() => import('@/pages/ProjectPage'))
const Skills          = lazy(() => import('@/pages/Skills'))
const Services        = lazy(() => import('@/pages/Services'))
const Lab             = lazy(() => import('@/pages/Lab'))
const LabExperiment   = lazy(() => import('@/pages/LabExperiment'))
const Store           = lazy(() => import('@/pages/Store'))
const Media           = lazy(() => import('@/pages/Media'))
const Contact         = lazy(() => import('@/pages/Contact'))
const Admin             = lazy(() => import('@/pages/Admin'))
const NotFound          = lazy(() => import('@/pages/NotFound'))
const PantheonSignup      = lazy(() => import('@/pages/games/pantheon-wars/Signup'))
const PantheonLogin       = lazy(() => import('@/pages/games/pantheon-wars/Login'))
const PantheonDashboard   = lazy(() => import('@/pages/games/pantheon-wars/Dashboard'))
const PantheonQuests      = lazy(() => import('@/pages/games/pantheon-wars/Quests'))
const PantheonInventory   = lazy(() => import('@/pages/games/pantheon-wars/Inventory'))
const PantheonShop        = lazy(() => import('@/pages/games/pantheon-wars/Shop'))
const PantheonTemples     = lazy(() => import('@/pages/games/pantheon-wars/Temples'))
const PantheonPvP         = lazy(() => import('@/pages/games/pantheon-wars/PvP'))
const PantheonPvPLog      = lazy(() => import('@/pages/games/pantheon-wars/PvPLog'))
const PantheonLeaderboard = lazy(() => import('@/pages/games/pantheon-wars/Leaderboard'))
const PantheonProfile     = lazy(() => import('@/pages/games/pantheon-wars/Profile'))
const PantheonAdventures  = lazy(() => import('@/pages/games/pantheon-wars/Adventures'))
const PantheonTownship    = lazy(() => import('@/pages/games/pantheon-wars/Township'))
const PantheonTitan       = lazy(() => import('@/pages/games/pantheon-wars/Titan'))
const PantheonForgotPw    = lazy(() => import('@/pages/games/pantheon-wars/ForgotPassword'))
const PantheonResetPw     = lazy(() => import('@/pages/games/pantheon-wars/ResetPassword'))
const PantheonComingSoon  = lazy(() => import('@/pages/games/pantheon-wars/ComingSoon'))
const PantheonCodex       = lazy(() => import('@/pages/games/pantheon-wars/Codex'))

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingDot />
    </div>
  )
}

// Wraps inner pages with the active theme's layout
function PageLayout({ children }) {
  const { themeId } = useTheme()
  if (themeId === 'standard') return <StandardLayout>{children}</StandardLayout>
  if (themeId === 'retro')    return <RetroLayout>{children}</RetroLayout>
  return <>{children}</>
}

// Provides game state + forces Pantheon theme while on game routes.
// Title card + intro only fire when the user enters from outside the game
// (location.state.from === 'external'). Internal navigation never passes that state.
function PantheonWarsShell() {
  const location = useLocation()
  const cameFromOutside = location.state?.from === 'external'
  const [showTitleCard, setShowTitleCard] = useState(cameFromOutside)

  useEffect(() => {
    // Clear entry state so back/forward or internal navigation won't re-trigger.
    if (cameFromOutside) {
      window.history.replaceState({}, '', location.pathname)
    }

    document.documentElement.dataset.ui = 'pantheon'
    soundManager.setActiveTheme('pantheon')
    soundManager.setPack('pantheon')
    soundManager.preloadPack('pantheon')

    // play() handles all cases: defers via _pendingResume if music is active,
    // registers an interaction retry if autoplay is blocked, otherwise starts immediately.
    ambienceManager.play('/sounds/pantheon_wars/ambience.mp3')

    return () => {
      const saved = localStorage.getItem('fp-theme')
      const safe = (!saved || saved === 'pantheon') ? 'standard' : saved
      document.documentElement.dataset.ui = safe
      soundManager.setActiveTheme(safe)
      const packMap = { digital: 'digital', retro: 'retro' }
      soundManager.setPack(packMap[safe] ?? null)
      ambienceManager.stop()
      musicManager.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTitleCardComplete() {
    setShowTitleCard(false)
    // Do NOT start ambience here — it starts automatically when intro song ends
    // via the fp-music-playback-change { playing: false } event from MusicManager
  }

  return (
    <PantheonWarsProvider>
      <ChatProvider>
        {showTitleCard && <PWTitleCardSequence onComplete={handleTitleCardComplete} />}
        <Outlet />
        <ChatBar />
      </ChatProvider>
    </PantheonWarsProvider>
  )
}

function HomeRoute() {
  const { themeId } = useTheme()
  if (themeId === 'retro') {
    return <RetroLayout><RetroLanding /></RetroLayout>
  }
  return <PageLayout><StandardLanding /></PageLayout>
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Entry points — each manages its own layout */}
        <Route path="/"    element={<Landing />} />
        <Route path="/home" element={<HomeRoute />} />
        <Route path="/hub"  element={<Hub />} />

        {/* Inner pages — PageLayout adds StandardLayout when themeId === 'standard' */}
        <Route path="/about"              element={<PageLayout><About /></PageLayout>} />
        <Route path="/portfolio"          element={<PageLayout><Portfolio /></PageLayout>} />
        <Route path="/portfolio/:slug"    element={<PageLayout><ProjectPage /></PageLayout>} />
        <Route path="/skills"             element={<PageLayout><Skills /></PageLayout>} />
        <Route path="/services"           element={<PageLayout><Services /></PageLayout>} />
        <Route path="/services/:category" element={<PageLayout><Services /></PageLayout>} />
        <Route path="/lab"                element={<PageLayout><Lab /></PageLayout>} />
        <Route path="/lab/:slug"          element={<PageLayout><LabExperiment /></PageLayout>} />
        <Route path="/store"              element={<PageLayout><Store /></PageLayout>} />
        <Route path="/media"              element={<PageLayout><Media /></PageLayout>} />
        <Route path="/contact"            element={<PageLayout><Contact /></PageLayout>} />
        <Route path="/admin"              element={<Admin />} />
        <Route path="*"                   element={<PageLayout><NotFound /></PageLayout>} />
      </Routes>
    </AnimatePresence>
  )
}

// Standalone Pantheon Wars routing — lives outside AnimatedRoutes so PantheonWarsShell
// never remounts during internal game navigation. The AnimatedRoutes key={pathname} pattern
// would unmount/remount the shell (and stop the intro song) on every internal navigate.
function PantheonWarsRoutes() {
  return (
    <Routes>
      <Route element={<PantheonWarsShell />}>
        <Route path="/games/pantheon-wars"             element={<PantheonDashboard />} />
        <Route path="/games/pantheon-wars/quests"      element={<PantheonQuests />} />
        <Route path="/games/pantheon-wars/signup"      element={<PantheonSignup />} />
        <Route path="/games/pantheon-wars/login"       element={<PantheonLogin />} />
        <Route path="/games/pantheon-wars/inventory"   element={<PantheonInventory />} />
        <Route path="/games/pantheon-wars/shop"        element={<PantheonShop />} />
        <Route path="/games/pantheon-wars/temples"     element={<PantheonTemples />} />
        <Route path="/games/pantheon-wars/pvp"         element={<PantheonPvP />} />
        <Route path="/games/pantheon-wars/pvp/log"     element={<PantheonPvPLog />} />
        <Route path="/games/pantheon-wars/leaderboard" element={<PantheonLeaderboard />} />
        <Route path="/games/pantheon-wars/profile"      element={<PantheonProfile />} />
        <Route path="/games/pantheon-wars/adventures"       element={<PantheonAdventures />} />
        <Route path="/games/pantheon-wars/township"        element={<PantheonTownship />} />
        <Route path="/games/pantheon-wars/titan"           element={<PantheonTitan />} />
        <Route path="/games/pantheon-wars/forgot-password" element={<PantheonForgotPw />} />
        <Route path="/games/pantheon-wars/reset-password"  element={<PantheonResetPw />} />
        <Route path="/games/pantheon-wars/codex"    element={<PantheonCodex />} />
        <Route path="/games/pantheon-wars/alliance" element={<PantheonComingSoon title="ALLIANCE" message="Soon, warriors will band together under shared banners. The Alliance system is forthcoming." />} />
        <Route path="/games/pantheon-wars/store"    element={<PantheonComingSoon title="STORE" message="Premium offerings will be available here in the future." />} />
      </Route>
    </Routes>
  )
}

function AppInner() {
  const { themeId } = useTheme()
  const { isOpen, close } = useTerminal()
  const location = useLocation()
  const isDigital = themeId === 'digital'
  const isGame = location.pathname.startsWith('/games/pantheon-wars')

  // Game routes rendered in isolation — no AnimatePresence keying, no Digital chrome.
  // This keeps PantheonWarsShell alive across all internal game navigation.
  if (isGame) {
    return (
      <>
        <AutoTrackers />
        <Suspense fallback={<PageLoader />}>
          <PantheonWarsRoutes />
        </Suspense>
      </>
    )
  }

  const routesEl = (
    <Suspense fallback={<PageLoader />}>
      <AnimatedRoutes />
    </Suspense>
  )

  return (
    <>
      <AutoTrackers />
      {isDigital && <PageChrome />}
      {isDigital && <SoundToggle />}
      {isDigital ? (
        <main id="main-content">{routesEl}</main>
      ) : (
        routesEl
      )}
      {isDigital && <Terminal isOpen={isOpen} onClose={close} />}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppInner />
        <DevThemeSwitcher />
      </BrowserRouter>
    </ThemeProvider>
  )
}

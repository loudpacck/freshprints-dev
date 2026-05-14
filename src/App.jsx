import { lazy, Suspense } from 'react'
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
const PantheonSignup    = lazy(() => import('@/pages/games/pantheon-wars/Signup'))
const PantheonLogin     = lazy(() => import('@/pages/games/pantheon-wars/Login'))
const PantheonDashboard = lazy(() => import('@/pages/games/pantheon-wars/Dashboard'))
const PantheonQuests    = lazy(() => import('@/pages/games/pantheon-wars/Quests'))

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

// Provides game state to all Pantheon Wars routes without adding visible UI
function PantheonWarsShell() {
  return (
    <PantheonWarsProvider>
      <Outlet />
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
        <Route path="/admin"                        element={<Admin />} />
        {/* Pantheon Wars — standalone, provider shared across all game routes */}
        <Route element={<PantheonWarsShell />}>
          <Route path="/games/pantheon-wars"               element={<PantheonDashboard />} />
          <Route path="/games/pantheon-wars/quests"        element={<PantheonQuests />} />
          <Route path="/games/pantheon-wars/signup"        element={<PantheonSignup />} />
          <Route path="/games/pantheon-wars/login"         element={<PantheonLogin />} />
        </Route>
        <Route path="*"                           element={<PageLayout><NotFound /></PageLayout>} />
      </Routes>
    </AnimatePresence>
  )
}

function AppInner() {
  const { themeId } = useTheme()
  const { isOpen, close } = useTerminal()
  const isDigital = themeId === 'digital'

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

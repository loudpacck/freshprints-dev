import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import PageChrome from '@/components/layout/PageChrome'
import SoundToggle from '@/components/layout/SoundToggle'
import Terminal from '@/components/terminal/Terminal'
import LoadingDot from '@/components/ui/LoadingDot'
import { useTerminal } from '@/hooks/useTerminal'
import { ThemeProvider, useTheme } from '@/themes/ThemeProvider'
import DevThemeSwitcher from '@/components/dev/DevThemeSwitcher'
import AutoTrackers from '@/tracking/AutoTrackers'
import StandardLayout from '@/components/standard/StandardLayout'

const Landing         = lazy(() => import('@/pages/Landing'))
const StandardLanding = lazy(() => import('@/pages/StandardLanding'))
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
const Admin           = lazy(() => import('@/pages/Admin'))
const NotFound        = lazy(() => import('@/pages/NotFound'))

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingDot />
    </div>
  )
}

// Wraps inner pages with StandardLayout when in Standard theme
function PageLayout({ children }) {
  const { themeId } = useTheme()
  if (themeId === 'standard') {
    return <StandardLayout>{children}</StandardLayout>
  }
  return <>{children}</>
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Entry points — each manages its own layout */}
        <Route path="/"    element={<Landing />} />
        <Route path="/home" element={<PageLayout><StandardLanding /></PageLayout>} />
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

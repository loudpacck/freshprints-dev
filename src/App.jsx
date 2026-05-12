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

// Conditional home route based on active theme
function HomeRoute() {
  const { themeId } = useTheme()
  return themeId === 'standard' ? <StandardLanding /> : <Landing />
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"                   element={<HomeRoute />} />
        <Route path="/hub"                element={<Hub />} />
        <Route path="/about"              element={<About />} />
        <Route path="/portfolio"          element={<Portfolio />} />
        <Route path="/portfolio/:slug"    element={<ProjectPage />} />
        <Route path="/skills"             element={<Skills />} />
        <Route path="/services"           element={<Services />} />
        <Route path="/services/:category" element={<Services />} />
        <Route path="/lab"                element={<Lab />} />
        <Route path="/lab/:slug"          element={<LabExperiment />} />
        <Route path="/store"              element={<Store />} />
        <Route path="/media"              element={<Media />} />
        <Route path="/contact"            element={<Contact />} />
        <Route path="/admin"              element={<Admin />} />
        <Route path="*"                   element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

function AppInner() {
  const { themeId } = useTheme()
  const { isOpen, close } = useTerminal()

  const routes = (
    <Suspense fallback={<PageLoader />}>
      <AnimatedRoutes />
    </Suspense>
  )

  if (themeId === 'standard') {
    return (
      <>
        <AutoTrackers />
        <StandardLayout>
          {routes}
        </StandardLayout>
      </>
    )
  }

  // Digital UI — existing chrome
  return (
    <>
      <AutoTrackers />
      <PageChrome />
      <SoundToggle />
      <main id="main-content">
        {routes}
      </main>
      <Terminal isOpen={isOpen} onClose={close} />
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

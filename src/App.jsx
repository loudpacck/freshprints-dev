import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import PageChrome from '@/components/layout/PageChrome'
import SoundToggle from '@/components/layout/SoundToggle'
import Terminal from '@/components/terminal/Terminal'
import LoadingDot from '@/components/ui/LoadingDot'
import { useTerminal } from '@/hooks/useTerminal'
import { ThemeProvider } from '@/themes/ThemeProvider'
import DevThemeSwitcher from '@/components/dev/DevThemeSwitcher'

const Landing      = lazy(() => import('@/pages/Landing'))
const Hub          = lazy(() => import('@/pages/Hub'))
const About        = lazy(() => import('@/pages/About'))
const Portfolio    = lazy(() => import('@/pages/Portfolio'))
const ProjectPage  = lazy(() => import('@/pages/ProjectPage'))
const Skills       = lazy(() => import('@/pages/Skills'))
const Services     = lazy(() => import('@/pages/Services'))
const Lab          = lazy(() => import('@/pages/Lab'))
const LabExperiment = lazy(() => import('@/pages/LabExperiment'))
const Store        = lazy(() => import('@/pages/Store'))
const Media        = lazy(() => import('@/pages/Media'))
const Contact      = lazy(() => import('@/pages/Contact'))
const NotFound     = lazy(() => import('@/pages/NotFound'))

function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <LoadingDot />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/about" element={<About />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:slug" element={<ProjectPage />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:category" element={<Services />} />
        <Route path="/lab" element={<Lab />} />
        <Route path="/lab/:slug" element={<LabExperiment />} />
        <Route path="/store" element={<Store />} />
        <Route path="/media" element={<Media />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

function AppInner() {
  const { isOpen, close } = useTerminal()

  return (
    <>
      <PageChrome />
      <SoundToggle />
      <main id="main-content">
        <Suspense fallback={<PageLoader />}>
          <AnimatedRoutes />
        </Suspense>
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

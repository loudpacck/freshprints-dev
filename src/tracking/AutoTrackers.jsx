import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '@/themes/useTheme'
import { tracker } from './Tracker'

export default function AutoTrackers() {
  const location = useLocation()
  const { themeId, mode } = useTheme()

  useEffect(() => { tracker.setContext({ uiTheme: themeId, uiMode: mode }) }, [themeId, mode])

  useEffect(() => {
    tracker.track('page_view', {
      path: location.pathname,
      title: document.title,
      referrer: document.referrer,
    })
  }, [location.pathname])

  useEffect(() => {
    const reached = new Set()
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      const pct = Math.round((window.scrollY / max) * 100)
      ;[25, 50, 75, 100].forEach(threshold => {
        if (pct >= threshold && !reached.has(threshold)) {
          reached.add(threshold)
          tracker.track('scroll_depth', { depth: threshold, path: window.location.pathname })
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  useEffect(() => {
    const startedAt = Date.now()
    const path = location.pathname
    return () => {
      const seconds = Math.round((Date.now() - startedAt) / 1000)
      if (seconds >= 2) tracker.track('time_on_page', { path, seconds })
    }
  }, [location.pathname])

  return null
}

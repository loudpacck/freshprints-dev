import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Browsers preserve scroll offset across pushState navigations. Without this,
// a page mounts at whatever scrollY the previous page was at — which breaks
// scroll-triggered reveal animations (StandardReveal) that depend on landing
// at the top and scrolling down through each section.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

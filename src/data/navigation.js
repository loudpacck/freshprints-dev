/**
 * SINGLE SOURCE OF TRUTH FOR SITE NAVIGATION.
 *
 * Every theme's chrome (nav, footer, toolbar) renders from these arrays.
 * Themes must NOT hardcode their own link lists — if a destination needs to
 * appear, change, or disappear, it happens here and every theme follows.
 *
 * `id` is a stable slug so themes can key off identity rather than label text.
 * Label casing/formatting is the theme's business; the label here is canonical.
 *
 * Note: /services is intentionally absent — it merges into /hire in a later
 * phase. The route and page still exist and remain reachable directly.
 */

// The canonical 6 destinations, in canonical order. Every theme's primary
// chrome renders exactly this list, in exactly this order.
export const PRIMARY_NAV = [
  { id: 'work',    label: 'Work',    href: '/portfolio' },
  { id: 'lab',     label: 'Lab',     href: '/lab' },
  { id: 'hire',    label: 'Hire',    href: '/hire' },
  { id: 'media',   label: 'Media',   href: '/media' },
  { id: 'about',   label: 'About',   href: '/about' },
  { id: 'contact', label: 'Contact', href: '/contact' },
]

// Secondary destinations — footer only, never in the primary nav.
// Skills merges into About in a later phase; keep it reachable until then.
export const UTILITY_NAV = [
  { id: 'skills', label: 'Skills', href: '/skills' },
]

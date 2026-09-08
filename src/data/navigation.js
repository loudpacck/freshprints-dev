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
 * Note: /services merged into /hire; /skills merged into /about. Both old
 * routes now redirect and are intentionally absent from every list here.
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
// Currently EMPTY: Skills merged into /about in Phase 6 and was the only entry.
// The export stays so footers can keep spreading it; add future footer-only
// destinations here.
export const UTILITY_NAV = []

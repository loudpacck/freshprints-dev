export const CATEGORY_COLORS = {
  software:    '#00C8FF',
  games:       '#FFB347',
  engineering: '#A0A0B8',
  ai:          '#8B5CF6',
  content:     '#FBBF24',
  default:     '#50505F',
}

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default
}

export function getCategoryIcon(category) {
  switch (category) {
    case 'software':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="14,18 8,24 14,30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <polyline points="34,18 40,24 34,30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <line x1="28" y1="12" x2="20" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    case 'games':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="16" width="32" height="20" rx="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
          <line x1="16" y1="22" x2="16" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="12" y1="26" x2="20" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="32" cy="24" r="1.5" fill="currentColor"/>
          <circle cx="36" cy="28" r="1.5" fill="currentColor"/>
          <circle cx="28" cy="28" r="1.5" fill="currentColor"/>
          <circle cx="32" cy="32" r="1.5" fill="currentColor"/>
        </svg>
      )
    case 'engineering':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2.5" fill="none"/>
          <circle cx="24" cy="24" r="3" fill="currentColor"/>
          <path d="M24 8v5M24 35v5M8 24h5M35 24h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M13.1 13.1l3.5 3.5M31.4 31.4l3.5 3.5M13.1 34.9l3.5-3.5M31.4 16.6l3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    case 'ai':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="2.5" fill="none"/>
          <circle cx="10" cy="14" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="38" cy="14" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="10" cy="34" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="38" cy="34" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="24" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="24" cy="40" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="13" y1="15.5" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="35" y1="15.5" x2="27" y2="21" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="13" y1="32.5" x2="21" y2="27" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="35" y1="32.5" x2="27" y2="27" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="24" y1="11" x2="24" y2="20" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="24" y1="28" x2="24" y2="37" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    case 'content':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2.5" fill="none"/>
          <polygon points="20,18 32,24 20,30" fill="currentColor"/>
        </svg>
      )
    default:
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none"/>
          <line x1="16" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="16" y1="26" x2="28" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="16" y1="32" x2="24" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
  }
}

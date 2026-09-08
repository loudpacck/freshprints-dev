// Service type vocabulary for the intake wizard.
// IDs MUST match `id` in src/data/services.js — that file is the source of truth
// and is what PackageCard/ServiceCategoryBlock pass as `prefillServiceType`.
export const SERVICE_TYPES = [
  { id: 'engineering',  label: 'Engineering',  icon: '⚙️' },
  { id: 'software',     label: 'Software',     icon: '</>' },
  { id: 'gamedev',      label: 'Games',        icon: '🎮' },
  { id: 'ai',           label: 'AI',           icon: '◈' },
  { id: 'content',      label: 'Content',      icon: '▶' },
  { id: 'fresh-prints', label: 'Fresh Prints', icon: '□' },
]

// service id -> category key used by getCategoryColor()
export const SERVICE_TYPE_CATEGORY = {
  engineering: 'engineering',
  software: 'software',
  gamedev: 'games',
  ai: 'ai',
  content: 'content',
  'fresh-prints': 'engineering',
}

export const SERVICE_TYPE_LABEL = Object.fromEntries(
  SERVICE_TYPES.map(t => [t.id, t.label])
)

export function serviceTypeCategory(id) {
  return SERVICE_TYPE_CATEGORY[id] ?? id
}

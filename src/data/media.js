import { socialLinks } from './socialLinks'

export const media = {
  channelUrl: socialLinks.youtube.general.url,
  docsChannelUrl: socialLinks.youtube.docs.url,

  featuredVideoId: null,

  newsletterCopy: {
    eyebrow: '// DISPATCH',
    heading: 'GET NOTIFIED',
    body: 'Get notified when I ship something new. No spam, no fluff. Just the build log.',
    cta: 'SUBSCRIBE',
    success: '// SUBSCRIBED. CHECK YOUR INBOX.',
  },

  tabs: [
    { id: 'loudd-docs',    label: 'Loudd Docs',    active: true,  channelUrl: socialLinks.youtube.docs.url },
    { id: 'loudd',         label: 'Loudd',          active: true,  channelUrl: socialLinks.youtube.general.url },
    { id: 'devlogs',       label: 'Devlogs',        active: false, comingSoonMessage: 'Project devlogs coming soon — diving deeper into freshprints.dev, Jogger, and other builds.' },
    { id: 'design',        label: 'Design',         active: false, comingSoonMessage: 'Design process content coming soon — CAD walkthroughs, UI breakdowns, and creative direction.' },
    { id: 'production',    label: 'Production',     active: false, comingSoonMessage: 'Production workflows coming soon — manufacturing, prototyping, and shop floor content.' },
    { id: 'ai-production', label: 'AI Production',  active: false, comingSoonMessage: 'AI-assisted production content coming soon — workflows, tools, and case studies.' },
    { id: 'music',         label: 'Music',          active: false, comingSoonMessage: 'Original music coming soon. A whole different side of what I make.' },
  ],

  // Each video: { id (YouTube video ID), title, description, tabId, duration, publishedAt }
  videos: [],
}

export function getThumbnailUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

export function getThumbnailFallbackUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

export function getEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
}

export function getVideosForTab(tabId) {
  if (tabId === 'all') return media.videos
  return media.videos.filter(v => v.tabId === tabId)
}

export function getTabById(id) {
  return media.tabs.find(t => t.id === id) ?? null
}

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
    { id: 'devlogs',    label: 'Devlogs',      color: '#00C8FF' },
    { id: 'builds',     label: 'Build Series',  color: '#FFB347' },
    { id: 'docs',       label: 'Mini Docs',     color: '#8B5CF6' },
    { id: 'standalone', label: 'One-offs',      color: '#A0A0B8' },
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

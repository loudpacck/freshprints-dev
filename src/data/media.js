import { socialLinks } from './socialLinks'

export const media = {
  channelUrl: socialLinks.youtube.general.url,
  docsChannelUrl: socialLinks.youtube.docs.url,

  featuredVideoId: 'C9IFqQgWWas',

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
  videos: [
    // === Loudd Docs (4 videos) ===
    {
      id: 'C9IFqQgWWas',
      title: 'The Ban Bounce',
      description: 'How banned creators stage their comebacks — the psychology and strategy behind digital exile and return.',
      tabId: 'loudd-docs',
      duration: null,
      publishedAt: null,
    },
    {
      id: 'zATn1z9MxxU',
      title: 'The H3 Story',
      description: 'Ethan Klein and the rise of H3 — from a podcast in a basement to a media empire.',
      tabId: 'loudd-docs',
      duration: null,
      publishedAt: null,
    },
    {
      id: 'C3omSntjuZE',
      title: 'The Rise and Fall of Vine',
      description: 'How a 6-second video app shaped a generation of creators — and why it died young.',
      tabId: 'loudd-docs',
      duration: null,
      publishedAt: null,
    },
    {
      id: 'JohN868pw4o',
      title: 'The Rise and Fall of Daily Vlogging',
      description: 'When daily vlogs ruled YouTube — and the burnout cycle that ended the era.',
      tabId: 'loudd-docs',
      duration: null,
      publishedAt: null,
    },

    // === Loudd (5 most viewed) ===
    {
      id: 'A7q9NFTEk40',
      title: 'Welcome To My YouTube Channel',
      description: 'Channel intro — what to expect from the chaos.',
      tabId: 'loudd',
      duration: null,
      publishedAt: null,
    },
    {
      id: 'abA0ZZezaE4',
      title: "Nor'Easter 2023",
      description: "Riding out the 2023 Nor'easter — storm coverage from New England.",
      tabId: 'loudd',
      duration: null,
      publishedAt: null,
    },
    {
      id: 'WJqBhlZ-odU',
      title: "Nor'Easter 2024",
      description: "The 2024 Nor'easter rolls through. Another year, another wild storm.",
      tabId: 'loudd',
      duration: null,
      publishedAt: null,
    },
    {
      id: 'wEszZZV2yGA',
      title: 'I BROKE LETHAL COMPANY',
      description: 'Pushing Lethal Company way past its intended limits.',
      tabId: 'loudd',
      duration: null,
      publishedAt: null,
    },
    {
      id: 'jcmAnWiWG28',
      title: 'SUPER ACROBATIC ROCKET POWERED BATTLE GOLF...?',
      description: "Rocket League meets golf. Yes, it's a thing. Yes, it's as chaotic as it sounds.",
      tabId: 'loudd',
      duration: null,
      publishedAt: null,
    },
  ],
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

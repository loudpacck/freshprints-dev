export const socialLinks = {
  email: 'kyle@freshprints.dev',
  linkedin: {
    label: 'LINKEDIN',
    url: 'https://www.linkedin.com/in/kyle-debord-976252186/',
    handle: '@kyle-debord',
    description: 'Professional network',
  },
  github: {
    label: 'GITHUB',
    url: 'https://github.com/loudpacck',
    handle: '@loudpacck',
    description: 'Code, projects, experiments',
  },
  youtube: {
    general: {
      label: 'YOUTUBE',
      url: 'https://www.youtube.com/@loudd',
      handle: '@loudd',
      description: 'Devlogs and build series',
    },
    docs: {
      label: 'YOUTUBE — MINI DOCS',
      url: 'https://www.youtube.com/@LouddDocs',
      handle: '@LouddDocs',
      description: 'Short documentaries',
    },
  },
}

export const socialList = [
  { id: 'email',        label: 'EMAIL',              url: `mailto:${socialLinks.email}`, handle: socialLinks.email,                  description: 'Direct line for serious inquiries' },
  { id: 'youtube-main', ...socialLinks.youtube.general },
  { id: 'youtube-docs', ...socialLinks.youtube.docs },
  { id: 'github',       ...socialLinks.github },
  { id: 'linkedin',     ...socialLinks.linkedin },
]

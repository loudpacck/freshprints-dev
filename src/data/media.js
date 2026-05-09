export const media = {
  channelUrl: 'https://youtube.com/@kyle-placeholder',
  newsletterPlaceholder: 'your@email.com',

  featured: {
    id: 'featured-1',
    title: 'Building Predictinator: From Spreadsheet to ML Model',
    description: 'How a frustration with sportsbook lines became a full-stack ML prediction engine.',
    youtubeId: 'dQw4w9WgXcQ',
    duration: '14:22',
    publishedAt: '2024-12-10',
    series: 'predictinator',
  },

  series: [
    { id: 'predictinator', label: 'Predictinator Devlog', color: '#00C8FF' },
    { id: 'plutus',        label: 'Plutus Build Series',  color: '#22C55E' },
    { id: 'pantheon',      label: 'Pantheon Devlog',      color: '#FFB347' },
    { id: 'fresh-prints',  label: 'Shop Floor',           color: '#A0A0B8' },
    { id: 'standalone',    label: 'One-offs',             color: '#9090A8' },
  ],

  videos: [
    { id: 'v1',  title: 'Building Predictinator: From Spreadsheet to ML Model', description: 'Origin story of the prediction engine.',     youtubeId: 'dQw4w9WgXcQ', duration: '14:22', publishedAt: '2024-12-10', series: 'predictinator' },
    { id: 'v2',  title: 'Why I Built My Own Crypto Bot',                        description: 'Plutus episode 1 — motivation and stack.',   youtubeId: 'dQw4w9WgXcQ', duration: '11:08', publishedAt: '2024-11-22', series: 'plutus' },
    { id: 'v3',  title: 'Plutus Backtesting Engine Walkthrough',                description: 'How I run strategies against history.',       youtubeId: 'dQw4w9WgXcQ', duration: '18:45', publishedAt: '2024-11-15', series: 'plutus' },
    { id: 'v4',  title: 'UE5 Multiplayer: First Networked Prototype',           description: 'Pantheon takes its first real shape.',        youtubeId: 'dQw4w9WgXcQ', duration: '22:30', publishedAt: '2024-11-01', series: 'pantheon' },
    { id: 'v5',  title: 'Reverse Engineering a Broken Part',                    description: 'Scan to model to print in one afternoon.',    youtubeId: 'dQw4w9WgXcQ', duration: '9:14',  publishedAt: '2024-10-20', series: 'fresh-prints' },
    { id: 'v6',  title: 'Predictinator Hits 64% Accuracy',                      description: 'What changed in the last model iteration.',   youtubeId: 'dQw4w9WgXcQ', duration: '12:55', publishedAt: '2024-10-05', series: 'predictinator' },
    { id: 'v7',  title: 'My Workshop Setup, 2024',                              description: 'Tour of the printers, scanners, and bench.',  youtubeId: 'dQw4w9WgXcQ', duration: '16:00', publishedAt: '2024-09-18', series: 'fresh-prints' },
    { id: 'v8',  title: 'Plutus: Live Trading Mode',                            description: 'Going from sim to actual money on the line.', youtubeId: 'dQw4w9WgXcQ', duration: '20:12', publishedAt: '2024-09-02', series: 'plutus' },
    { id: 'v9',  title: 'Building a CAD Validation AI',                         description: 'Architect concept walkthrough.',              youtubeId: 'dQw4w9WgXcQ', duration: '15:33', publishedAt: '2024-08-15', series: 'standalone' },
    { id: 'v10', title: 'Why I Stopped Using SaaS Tools',                       description: 'Building my own stack as a solo operator.',   youtubeId: 'dQw4w9WgXcQ', duration: '10:40', publishedAt: '2024-07-28', series: 'standalone' },
  ],
}

export function getVideosBySeries(seriesId) {
  if (seriesId === 'all') return media.videos
  return media.videos.filter(v => v.series === seriesId)
}

export function getSeries(id) {
  return media.series.find(s => s.id === id)
}

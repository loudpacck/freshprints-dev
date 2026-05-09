import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { media } from '@/data/media'

function YoutubeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <polygon points="10,8.5 16,12 10,15.5" fill="currentColor"/>
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.417 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  )
}

function LinkedinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
      <polyline points="2,6 12,13 22,6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

const CARDS = [
  {
    id: 'youtube',
    label: 'YOUTUBE',
    desc: 'Devlogs and build series',
    href: media.channelUrl,
    external: true,
    color: '#FF4444',
    Icon: YoutubeIcon,
  },
  {
    id: 'github',
    label: 'GITHUB',
    desc: 'Code, projects, experiments',
    // kyle: replace with your actual GitHub URL
    href: 'https://github.com/kyle-placeholder',
    external: true,
    color: '#A0A0B8',
    Icon: GithubIcon,
  },
  {
    id: 'linkedin',
    label: 'LINKEDIN',
    desc: 'Professional network',
    // kyle: replace with your actual LinkedIn URL
    href: 'https://linkedin.com/in/kyle-placeholder',
    external: true,
    color: '#0077B5',
    Icon: LinkedinIcon,
  },
  {
    id: 'email',
    label: 'EMAIL',
    desc: 'Direct line for serious inquiries',
    href: '/contact',
    external: false,
    color: '#00C8FF',
    Icon: EmailIcon,
  },
]

function ConnectCard({ label, desc, href, external, color, Icon }) {
  const inner = (
    <motion.div
      whileHover={{ y: -2, borderColor: color }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        cursor: 'pointer',
        textDecoration: 'none',
        height: '100%',
      }}
    >
      <div style={{ color }}>
        <Icon />
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-snug)',
      }}>
        {desc}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color,
        marginTop: 'auto',
      }}>
        → OPEN
      </div>
    </motion.div>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        {inner}
      </a>
    )
  }

  return (
    <Link to={href} style={{ textDecoration: 'none' }}>
      {inner}
    </Link>
  )
}

export default function AboutConnect() {
  return (
    <section style={{ marginBottom: 'var(--space-20)' }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-accent)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-widest)',
        marginBottom: 'var(--space-8)',
      }}>
        // CONNECT
      </p>

      <div className="grid-2-col">
        {CARDS.map(card => (
          <ConnectCard key={card.id} {...card} />
        ))}
      </div>
    </section>
  )
}

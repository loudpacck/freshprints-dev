import { useState } from 'react'
import { Link } from 'react-router-dom'
import Tag from '@/components/ui/Tag'
import Badge from '@/components/ui/Badge'
import { getCategoryColor, getCategoryIcon } from '@/utils/categoryAssets'

export default function ProjectHero({ project }) {
  const [imgFailed, setImgFailed] = useState(false)
  const primaryCategory = project.category?.[0] ?? 'default'
  const accentColor = getCategoryColor(primaryCategory)
  const heroImage = project.images?.[0] ?? project.thumbnail

  return (
    <div
      style={{
        position: 'relative',
        height: 'clamp(300px, 60vh, 600px)',
        overflow: 'hidden',
        marginBottom: 'var(--space-12)',
      }}
    >
      {/* Background: image or gradient fallback */}
      {!imgFailed && heroImage ? (
        <img
          src={heroImage}
          alt={project.name}
          decoding="async"
          onError={() => setImgFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${accentColor}26 0%, ${accentColor}0D 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
            opacity: 0.3,
          }}
        >
          <div style={{ transform: 'scale(3)' }}>
            {getCategoryIcon(primaryCategory)}
          </div>
        </div>
      )}

      {/* Dark gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(10,10,15,0.85) 100%)',
        }}
      />

      {/* Overlay content */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--space-12) var(--space-8) var(--space-8)' }}>
        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          {project.category.map((cat) => (
            <Tag key={cat} label={cat} category={cat} size="sm" />
          ))}
        </div>

        {/* Name */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 6vw, var(--text-6xl))',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-tight)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {project.name}
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {project.tagline}
        </p>

        {/* Meta strip */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <Badge status={project.status} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            {project.timeline}
          </span>
          <Link
            to="/portfolio"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            ← BACK TO PORTFOLIO
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
}

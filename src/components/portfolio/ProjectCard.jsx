import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Badge from '@/components/ui/Badge'
import { getCategoryColor, getCategoryIcon } from '@/utils/categoryAssets'
import { factKeyForSlug } from '@/components/hire/blobert/blobertLines'

function CategoryFallback({ category, aspectRatio }) {
  const color = getCategoryColor(category)
  const icon = getCategoryIcon(category)

  return (
    <div
      style={{
        width: '100%',
        aspectRatio,
        background: `linear-gradient(135deg, ${color}26 0%, ${color}0D 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        opacity: 0.4,
      }}
    >
      {icon}
    </div>
  )
}

const sizeConfig = {
  featured: {
    aspectRatio: '21/9',
    nameSize: 'var(--text-4xl)',
    padding: 'var(--space-6)',
  },
  default: {
    aspectRatio: '16/9',
    nameSize: 'var(--text-2xl)',
    padding: 'var(--space-6)',
  },
  compact: {
    aspectRatio: null,
    nameSize: 'var(--text-xl)',
    padding: 'var(--space-4)',
  },
}

export default function ProjectCard({ project, size = 'default' }) {
  const navigate = useNavigate()
  const [imgFailed, setImgFailed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const primaryCategory = project.category?.[0] ?? 'default'
  const accentColor = getCategoryColor(primaryCategory)
  const config = sizeConfig[size] ?? sizeConfig.default

  function handleClick() {
    navigate(`/portfolio/${project.slug}`)
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-blobert-fact={factKeyForSlug(project.slug) || undefined}
      style={{ height: '100%' }}
    >
      <Card
        hoverable
        accentColor={accentColor}
        onClick={handleClick}
        style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', height: '100%' }}
      >
        {/* Thumbnail / Fallback */}
        {size !== 'compact' && (
          <div style={{ overflow: 'hidden' }}>
            {!imgFailed ? (
              <motion.img
                src={project.thumbnail}
                alt={project.name}
                onError={() => setImgFailed(true)}
                style={{
                  width: '100%',
                  aspectRatio: config.aspectRatio,
                  objectFit: 'cover',
                  display: 'block',
                }}
                animate={{ scale: isHovered ? 1.03 : 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            ) : (
              <CategoryFallback category={primaryCategory} aspectRatio={config.aspectRatio} />
            )}
          </div>
        )}

        {/* Card body */}
        <div style={{ padding: config.padding, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {project.category.map((cat) => (
              <Tag key={cat} label={cat} category={cat} size="sm" />
            ))}
          </div>

          {/* Name */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: config.nameSize,
              lineHeight: 'var(--leading-tight)',
              color: 'var(--color-text-primary)',
              letterSpacing: 'var(--tracking-tight)',
            }}
          >
            {project.name}
          </div>

          {/* Tagline */}
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-snug)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.tagline}
          </div>

          {/* Footer row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'var(--space-1)',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <Badge status={project.status} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: accentColor,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wider)',
                    textDecoration: 'none',
                    border: `1px solid ${accentColor}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px var(--space-3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  VISIT SITE ↗
                </a>
              )}
              <motion.span
                animate={{
                  opacity: isHovered ? 1 : 0,
                  x: isHovered ? 0 : -4,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wider)',
                }}
              >
                VIEW →
              </motion.span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

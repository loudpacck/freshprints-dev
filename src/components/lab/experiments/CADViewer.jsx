import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cadModels } from '@/data/cadModels'
import LoadingDot from '@/components/ui/LoadingDot'

const monoSm = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-wide)',
}

function ModelViewerEl({ src }) {
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    setLoading(true)
    const el = ref.current
    if (!el) return
    const onLoad = () => setLoading(false)
    el.addEventListener('load', onLoad)
    return () => el.removeEventListener('load', onLoad)
  }, [src])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1, background: 'var(--color-bg-elevated)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <LoadingDot />
        </div>
      )}
      <model-viewer
        ref={ref}
        src={encodeURI(src)}
        alt={src.split('/').pop().replace('.glb', '')}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ padding: 'var(--space-16)', textAlign: 'center' }}>
      <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
        // NO MODELS
      </p>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)',
        color: 'var(--color-text-primary)',
        margin: '0 0 var(--space-3)',
      }}>
        No CAD models yet
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)', maxWidth: 360, margin: '0 auto' }}>
        Drop .glb files into <code style={{ fontFamily: 'var(--font-mono)' }}>public/3d_files/</code> to see them appear here.
      </p>
    </div>
  )
}

export default function CADViewer() {
  const [activeId, setActiveId] = useState(cadModels[0]?.id ?? null)

  if (!cadModels.length) return <EmptyState />

  const activeModel = cadModels.find(m => m.id === activeId) ?? cadModels[0]

  return (
    <div className="cad-root">

      {/* Mobile: dropdown model selector */}
      <div className="cad-mobile-select">
        <select
          value={activeId ?? ''}
          onChange={e => setActiveId(e.target.value)}
          style={{
            width: '100%',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            marginBottom: 'var(--space-4)',
          }}
        >
          {cadModels.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Desktop: sidebar + main */}
      <div className="cad-grid" style={{
        display: 'grid',
        gridTemplateColumns: '30% 1fr',
        gap: 'var(--space-6)',
        alignItems: 'start',
      }}>

        {/* Left: model list */}
        <div className="cad-sidebar" style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          {cadModels.map(m => {
            const isActive = m.id === activeId
            return (
              <button
                key={m.id}
                onClick={() => setActiveId(m.id)}
                style={{
                  width: '100%',
                  display: 'block',
                  padding: 'var(--space-4)',
                  background: 'none',
                  border: 'none',
                  borderLeft: isActive
                    ? '3px solid var(--color-accent-primary)'
                    : '3px solid transparent',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background var(--duration-base), border-color var(--duration-base)',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-bg-elevated)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}
              >
                <p style={{
                  ...monoSm,
                  fontWeight: 'var(--weight-medium)',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-primary)',
                  margin: '0 0 var(--space-1)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'color var(--duration-base)',
                }}>
                  {m.name}
                </p>
                <p style={{
                  ...monoSm,
                  fontSize: '0.65rem',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}>
                  {m.source.toUpperCase()}
                </p>
              </button>
            )
          })}
        </div>

        {/* Right: viewer + info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Viewer */}
          <div className="cad-viewer-box" style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            height: 480,
            overflow: 'hidden',
          }}>
            <ModelViewerEl key={activeModel.file} src={activeModel.file} />
          </div>

          {/* Info panel */}
          <div style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-3)',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xl)',
                color: 'var(--color-text-primary)',
                margin: 0,
                lineHeight: 1.2,
              }}>
                {activeModel.name}
              </h2>
              <span style={{
                ...monoSm,
                color: 'var(--color-accent-primary)',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}>
                {activeModel.source}
              </span>
            </div>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              lineHeight: 'var(--leading-relaxed)',
              margin: '0 0 var(--space-4)',
            }}>
              {activeModel.description}
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href={encodeURI(activeModel.file)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...monoSm,
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                  transition: 'color var(--duration-base)',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
              >
                {activeModel.file}
              </a>

              {activeModel.relatedProjectSlug && (
                <Link
                  to={`/portfolio/${activeModel.relatedProjectSlug}`}
                  style={{
                    ...monoSm,
                    color: 'var(--color-accent-primary)',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  View related project →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cad-mobile-select { display: none; }

        @media (max-width: 768px) {
          .cad-mobile-select { display: block; }
          .cad-sidebar { display: none !important; }
          .cad-grid { grid-template-columns: 1fr !important; }
          .cad-viewer-box { height: 320px !important; }
        }

        [data-ui="retro"] .cad-viewer-box {
          border-width: 2px !important;
          border-top-color: var(--bevel-light) !important;
          border-left-color: var(--bevel-light) !important;
          border-right-color: var(--bevel-dark) !important;
          border-bottom-color: var(--bevel-dark) !important;
        }
        [data-ui="retro"] .cad-sidebar {
          border-width: 2px;
          border-top-color: var(--bevel-light);
          border-left-color: var(--bevel-light);
          border-right-color: var(--bevel-dark);
          border-bottom-color: var(--bevel-dark);
        }
      `}</style>
    </div>
  )
}

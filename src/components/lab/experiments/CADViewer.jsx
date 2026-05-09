import { useState, useRef, useEffect } from 'react'
import Button from '@/components/ui/Button'
import LoadingDot from '@/components/ui/LoadingDot'

const MODELS = [
  {
    name: 'Bracket Assembly',
    material: 'Aluminum 6061',
    process: 'CNC Machined',
    dims: '120 × 80 × 25mm',
    weight: '180g',
    src: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  },
  {
    name: 'Enclosure Prototype',
    material: 'PETG',
    process: 'FDM Printed',
    dims: '200 × 150 × 60mm',
    weight: '95g',
    src: 'https://modelviewer.dev/shared-assets/models/RobotExpressive/RobotExpressive.glb',
  },
  {
    name: 'Mounting Plate',
    material: 'Steel 1018',
    process: 'Laser Cut',
    dims: '300 × 200 × 5mm',
    weight: '2.1kg',
    src: 'https://modelviewer.dev/shared-assets/models/Horse.glb',
  },
]

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

    function onLoad() { setLoading(false) }
    el.addEventListener('load', onLoad)
    return () => el.removeEventListener('load', onLoad)
  }, [src])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <LoadingDot />
        </div>
      )}
      <model-viewer
        ref={ref}
        src={src}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      />
    </div>
  )
}

export default function CADViewer() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = MODELS[selectedIndex]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '30% 70%',
        gap: 'var(--space-6)',
        alignItems: 'start',
      }}
      className="cad-grid"
    >
      {/* Left: Model picker */}
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {MODELS.map((model, i) => {
          const isSelected = i === selectedIndex
          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'none',
                border: 'none',
                borderLeft: isSelected ? `3px solid var(--color-accent-primary)` : '3px solid transparent',
                borderBottom: '1px solid var(--color-border-subtle)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--duration-base), border-color var(--duration-base)',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-bg-elevated)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'none' }}
            >
              {/* Thumbnail placeholder */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" stroke="var(--color-text-muted)" strokeWidth="1.2" />
                  <path d="M8 2V14M2 5.5L8 9L14 5.5" stroke="var(--color-text-muted)" strokeWidth="0.8" strokeDasharray="2 1" />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    ...monoSm,
                    color: isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-primary)',
                    textTransform: 'uppercase',
                    fontWeight: 'var(--weight-medium)',
                    margin: '0 0 var(--space-1)',
                    transition: 'color var(--duration-base)',
                  }}
                >
                  {model.name}
                </p>
                <p style={{ ...monoSm, color: 'var(--color-text-muted)', margin: 0, fontSize: '0.7rem' }}>
                  {model.material}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Right: Viewer + specs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Viewer */}
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            height: 500,
            overflow: 'hidden',
          }}
        >
          <ModelViewerEl key={selected.src} src={selected.src} />
        </div>

        {/* Specs grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-4)',
          }}
          className="cad-specs-grid"
        >
          {[
            { label: 'MATERIAL',   value: selected.material },
            { label: 'PROCESS',    value: selected.process },
            { label: 'DIMENSIONS', value: selected.dims },
            { label: 'WEIGHT',     value: selected.weight },
          ].map(spec => (
            <div
              key={spec.label}
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
              }}
            >
              <p style={{ ...monoSm, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                {spec.label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  fontWeight: 'var(--weight-medium)',
                }}
              >
                {spec.value}
              </p>
            </div>
          ))}
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm">DOWNLOAD STEP</Button>
          <Button variant="ghost" size="sm">DOWNLOAD STL</Button>
          <Button variant="secondary" size="sm">DISCUSS THIS PART</Button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .cad-grid { grid-template-columns: 1fr !important; }
          .cad-specs-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

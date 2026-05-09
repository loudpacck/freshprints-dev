import { Suspense } from 'react'
import LoadingDot from '@/components/ui/LoadingDot'

export default function ModelViewer({ src }) {
  if (!src) return null

  return (
    <section style={{ marginBottom: 'var(--space-16)' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-widest)',
          marginBottom: 'var(--space-6)',
        }}
      >
        // 3D MODEL
      </div>
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          height: 500,
          position: 'relative',
        }}
      >
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><LoadingDot /></div>}>
          <model-viewer
            src={src}
            auto-rotate
            camera-controls
            ar
            shadow-intensity="1"
            style={{ width: '100%', height: '100%' }}
          />
        </Suspense>
      </div>
    </section>
  )
}

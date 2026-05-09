import { useNavigate } from 'react-router-dom'
import { getCategoryColor } from '@/utils/categoryAssets'
import PackageCard from './PackageCard'

function ServiceIcon({ type, color }) {
  const p = { stroke: color, strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const s = { width: 32, height: 32 }
  switch (type) {
    case 'gear': return <svg viewBox="0 0 32 32" style={s}><circle cx="16" cy="16" r="4" {...p}/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7.1 7.1l2.8 2.8M22.1 22.1l2.8 2.8M7.1 24.9l2.8-2.8M22.1 9.9l2.8-2.8" {...p}/></svg>
    case 'code': return <svg viewBox="0 0 32 32" style={s}><polyline points="10,10 4,16 10,22" {...p}/><polyline points="22,10 28,16 22,22" {...p}/><line x1="20" y1="8" x2="12" y2="24" {...p}/></svg>
    case 'controller': return <svg viewBox="0 0 32 32" style={s}><rect x="4" y="10" width="24" height="16" rx="5" {...p}/><line x1="10" y1="15" x2="10" y2="21" {...p}/><line x1="7" y1="18" x2="13" y2="18" {...p}/><circle cx="22" cy="15" r="1.5" fill={color} stroke="none"/><circle cx="25" cy="18" r="1.5" fill={color} stroke="none"/><circle cx="19" cy="18" r="1.5" fill={color} stroke="none"/><circle cx="22" cy="21" r="1.5" fill={color} stroke="none"/></svg>
    case 'brain': return <svg viewBox="0 0 32 32" style={s}><path d="M16 8c-4 0-7 3-7 7 0 2.5 1 4.5 2.5 6L16 26l4.5-5c1.5-1.5 2.5-3.5 2.5-6 0-4-3-7-7-7z" {...p}/><line x1="16" y1="8" x2="16" y2="26" {...p}/></svg>
    case 'play': return <svg viewBox="0 0 32 32" style={s}><circle cx="16" cy="16" r="12" {...p}/><polygon points="13,11 23,16 13,21" fill={color} stroke="none"/></svg>
    case 'box': return <svg viewBox="0 0 32 32" style={s}><path d="M4 10l12-6 12 6v12l-12 6-12-6z" {...p}/><polyline points="4,10 16,16 28,10" {...p}/><line x1="16" y1="16" x2="16" y2="28" {...p}/></svg>
    default: return null
  }
}

export default function ServiceCategoryBlock({ service, onInquire }) {
  const navigate = useNavigate()
  const accentColor = getCategoryColor(service.category)

  return (
    <div style={{
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border-subtle)',
      borderTop: `2px solid ${accentColor}`,
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-8)',
    }}>
      {/* Service header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <span style={{ color: accentColor, opacity: 0.85 }}>
            <ServiceIcon type={service.icon} color={accentColor} />
          </span>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            lineHeight: 1,
            margin: 0,
          }}>
            {service.name}
          </h3>
        </div>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          margin: 0,
          lineHeight: 'var(--leading-snug)',
        }}>
          {service.description}
        </p>
      </div>

      {/* Package cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-5)',
      }}>
        {service.packages.map((pkg, i) => (
          <PackageCard
            key={i}
            pkg={pkg}
            serviceCategory={service.category}
            onInquire={() => onInquire(service.id)}
          />
        ))}
      </div>

      {/* Custom scope link */}
      {service.customAvailable && (
        <div style={{
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
          }}>
            Need something custom?
          </span>
          <button
            onClick={() => navigate('/contact')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: 3,
            }}
          >
            DISCUSS CUSTOM SCOPE →
          </button>
        </div>
      )}
    </div>
  )
}

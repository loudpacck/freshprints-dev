import { useNavigate } from 'react-router-dom'

export default function TownshipTopBar({ townships, templeData }) {
  const navigate = useNavigate()

  const professionCount = (townships || []).filter(t => t.is_owned).length
  const templeCount     = (templeData?.owned || []).length

  return (
    <div style={{
      flexShrink: 0,
      position: 'relative',
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      padding: '0 16px',
      background: 'linear-gradient(180deg, #1A1424 0%, rgba(10,7,16,0.97) 100%)',
      borderBottom: '1px solid rgba(201,169,97,0.22)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.7)',
    }}>
      <style>{`@media (max-width: 480px) { .tw-topbar-summary { display: none !important; } }`}</style>
      {/* Back button */}
      <button
        onClick={() => navigate('/games/pantheon-wars')}
        style={{
          background: 'none',
          border: '1px solid rgba(201,169,97,0.28)',
          borderRadius: 6,
          color: '#C9A961',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.12em',
          padding: '6px 14px',
          cursor: 'pointer',
          transition: 'border-color 150ms, color 150ms',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(201,169,97,0.65)'
          e.currentTarget.style.color = '#EDE3CC'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(201,169,97,0.28)'
          e.currentTarget.style.color = '#C9A961'
        }}
      >
        ← BACK
      </button>

      {/* Centred title */}
      <span style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: "'Cinzel', serif",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: '#EDE3CC',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        YOUR TOWNSHIP
      </span>

      {/* Summary — hidden below 480px to prevent top bar overflow */}
      <span
        className="tw-topbar-summary"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.09em',
          color: 'rgba(240,240,248,0.32)',
          whiteSpace: 'nowrap',
        }}
      >
        {townships != null
          ? `${professionCount}/8 Professions · ${templeCount} Temples`
          : '...'}
      </span>
    </div>
  )
}

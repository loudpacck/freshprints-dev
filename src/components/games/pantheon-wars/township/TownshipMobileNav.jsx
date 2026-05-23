import { SCENE_WIDTH } from './townshipConfig'

const ZONES = [
  { id: 'military', label: 'Military',    icon: '⚔',  sceneX: 0.12 * SCENE_WIDTH },
  { id: 'center',   label: 'Town Center', icon: '🏛',  sceneX: 0.50 * SCENE_WIDTH },
  { id: 'sacred',   label: 'Sacred Hill', icon: '✦',  sceneX: 0.85 * SCENE_WIDTH },
]

export default function TownshipMobileNav({ activeZone, isModalOpen, panToSceneX }) {
  if (isModalOpen) return null

  return (
    <>
      <style>{`
        .tw-mobile-nav { display: flex; }
        @media (min-width: 641px) { .tw-mobile-nav { display: none !important; } }
      `}</style>

      <div
        className="tw-mobile-nav"
        style={{
          position:       'fixed',
          bottom:         0,
          left:           0,
          right:          0,
          height:         48,
          zIndex:         200,
          alignItems:     'stretch',
          background:     'rgba(8,5,18,0.92)',
          borderTop:      '1px solid rgba(201,169,97,0.18)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {ZONES.map((zone, i) => {
          const isActive = activeZone === zone.id
          return (
            <button
              key={zone.id}
              onClick={() => panToSceneX?.(zone.sceneX)}
              aria-label={`Pan to ${zone.label}`}
              style={{
                flex:            1,
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                justifyContent:  'center',
                gap:             2,
                background:      isActive ? 'rgba(201,169,97,0.1)' : 'transparent',
                border:          'none',
                borderRight:     i < ZONES.length - 1 ? '1px solid rgba(201,169,97,0.1)' : 'none',
                borderTop:       isActive ? '2px solid rgba(201,169,97,0.55)' : '2px solid transparent',
                cursor:          'pointer',
                padding:         '4px 0',
                transition:      'background 0.18s, border-color 0.18s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{zone.icon}</span>
              <span style={{
                fontFamily:    "'IBM Plex Mono', monospace",
                fontSize:      9,
                letterSpacing: '0.08em',
                color:         isActive ? '#EDC87C' : 'rgba(201,169,97,0.45)',
                textTransform: 'uppercase',
                whiteSpace:    'nowrap',
                transition:    'color 0.18s',
              }}>
                {zone.label}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

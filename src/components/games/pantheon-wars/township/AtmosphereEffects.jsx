import { getExtrasUrl } from './townshipConfig'

const KEYFRAMES = `
  @keyframes tw-birds-a {
    0%, 100% { transform: translateX(0) translateY(0); }
    30%      { transform: translateX(3%) translateY(-10px); }
    70%      { transform: translateX(-2%) translateY(-5px); }
  }
  @keyframes tw-birds-b {
    0%, 100% { transform: translateX(0) translateY(0); }
    50%      { transform: translateX(-4%) translateY(-14px); }
  }
  @keyframes tw-smoke {
    0%   { transform: translateY(0) scaleX(1); opacity: 0; }
    20%  { opacity: 0.38; }
    80%  { opacity: 0.18; }
    100% { transform: translateY(-72px) scaleX(1.5); opacity: 0; }
  }
  @keyframes tw-fire-pulse {
    0%, 100% { opacity: 0.45; transform: scale(1) translateY(0); }
    50%      { opacity: 0.7;  transform: scale(1.08) translateY(-3px); }
  }
  @keyframes tw-particles {
    0%, 100% { transform: translateX(0) translateY(0); }
    50%      { transform: translateX(12px) translateY(-18px); }
  }
  @keyframes tw-ashes {
    0%   { transform: translateY(-10px) translateX(0); opacity: 0; }
    15%  { opacity: 0.22; }
    85%  { opacity: 0.12; }
    100% { transform: translateY(45px) translateX(18px); opacity: 0; }
  }
`

export default function AtmosphereEffects({ assetKey }) {
  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  if (reducedMotion) return null

  const birdsUrl = getExtrasUrl(assetKey, 'birds')
  const smokeUrl = getExtrasUrl(assetKey, 'smoke')
  const fireUrl  = getExtrasUrl(assetKey, 'fire')
  const envUrl   = getExtrasUrl(assetKey, 'enviroparticles')
  const ashesUrl = getExtrasUrl(assetKey, 'ashes')

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Birds — sky layer, 2 instances */}
      <img
        src={birdsUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', top: '11%', left: '18%',
          height: 56, width: 'auto', opacity: 0.55,
          animation: 'tw-birds-a 20s ease-in-out infinite',
          willChange: 'transform',
          pointerEvents: 'none', userSelect: 'none', zIndex: 7,
        }}
      />
      <img
        src={birdsUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', top: '19%', left: '63%',
          height: 44, width: 'auto', opacity: 0.38,
          animation: 'tw-birds-b 27s ease-in-out infinite 4s',
          willChange: 'transform',
          pointerEvents: 'none', userSelect: 'none', zIndex: 7,
        }}
      />

      {/* Smoke — 3 instances near building areas */}
      <img
        src={smokeUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', bottom: '38%', left: '16%',
          height: 80, width: 'auto', opacity: 0.3,
          animation: 'tw-smoke 7s ease-in-out infinite',
          willChange: 'transform, opacity',
          pointerEvents: 'none', userSelect: 'none', zIndex: 11,
        }}
      />
      <img
        src={smokeUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', bottom: '34%', left: '50%',
          height: 68, width: 'auto', opacity: 0.22,
          animation: 'tw-smoke 9s ease-in-out infinite 2.5s',
          willChange: 'transform, opacity',
          pointerEvents: 'none', userSelect: 'none', zIndex: 11,
        }}
      />
      <img
        src={smokeUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', bottom: '36%', left: '76%',
          height: 58, width: 'auto', opacity: 0.18,
          animation: 'tw-smoke 8s ease-in-out infinite 5s',
          willChange: 'transform, opacity',
          pointerEvents: 'none', userSelect: 'none', zIndex: 11,
        }}
      />

      {/* Fire — near town center buildings */}
      <img
        src={fireUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', bottom: '22%', left: '46%',
          height: 38, width: 'auto', opacity: 0.45,
          animation: 'tw-fire-pulse 2.2s ease-in-out infinite',
          willChange: 'transform, opacity',
          pointerEvents: 'none', userSelect: 'none', zIndex: 11,
        }}
      />
      <img
        src={fireUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', bottom: '20%', left: '15%',
          height: 32, width: 'auto', opacity: 0.35,
          animation: 'tw-fire-pulse 1.8s ease-in-out infinite 0.6s',
          willChange: 'transform, opacity',
          pointerEvents: 'none', userSelect: 'none', zIndex: 11,
        }}
      />

      {/* Env particles — very subtle scattered drift */}
      <img
        src={envUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', top: '35%', left: '38%',
          height: 90, width: 'auto', opacity: 0.1,
          animation: 'tw-particles 14s ease-in-out infinite',
          willChange: 'transform',
          pointerEvents: 'none', userSelect: 'none', zIndex: 8,
        }}
      />
      <img
        src={envUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', top: '42%', left: '72%',
          height: 70, width: 'auto', opacity: 0.08,
          animation: 'tw-particles 18s ease-in-out infinite 3s',
          willChange: 'transform',
          pointerEvents: 'none', userSelect: 'none', zIndex: 8,
        }}
      />

      {/* Ashes — gentle falling drift */}
      <img
        src={ashesUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', top: '30%', left: '28%',
          height: 55, width: 'auto', opacity: 0.18,
          animation: 'tw-ashes 11s ease-in-out infinite 1s',
          willChange: 'transform, opacity',
          pointerEvents: 'none', userSelect: 'none', zIndex: 8,
        }}
      />
      <img
        src={ashesUrl} alt="" draggable={false} decoding="async" loading="lazy"
        style={{
          position: 'absolute', top: '25%', left: '60%',
          height: 48, width: 'auto', opacity: 0.13,
          animation: 'tw-ashes 14s ease-in-out infinite 6s',
          willChange: 'transform, opacity',
          pointerEvents: 'none', userSelect: 'none', zIndex: 8,
        }}
      />
    </>
  )
}

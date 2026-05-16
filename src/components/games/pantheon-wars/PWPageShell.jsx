import { motion } from 'framer-motion'
import PWBackground from './PWBackground'
import PWHubLink from './PWHubLink'

// Inline SVG corner ornament — small gold flourish mark
function CornerGlyph({ style }) {
  return (
    <svg
      width="18" height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      style={{ position: 'absolute', color: 'var(--color-accent-gold-dim)', ...style }}
      fill="currentColor"
    >
      <path d="M1 1 L6 1 L1 6 Z" opacity="0.7" />
      <path d="M1 1 L1 3 M3 1 L1 3" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
  )
}

function CornerGlyphFlip({ style }) {
  return (
    <svg
      width="18" height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      style={{ position: 'absolute', color: 'var(--color-accent-gold-dim)', ...style }}
      fill="currentColor"
    >
      <path d="M17 17 L12 17 L17 12 Z" opacity="0.7" />
      <path d="M17 17 L17 15 M15 17 L17 15" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
  )
}

export default function PWPageShell({ title, rightSlot, backgroundVariant = 'dashboard', children }) {
  return (
    <>
      {/* ── Shared keyframes & utilities ─────────────────────────────────── */}
      <style>{`
        @keyframes pw-pulse { 0%,100%{opacity:1} 50%{opacity:0.38} }
        .pw-skel { background:rgba(255,255,255,0.07); animation:pw-pulse 1.6s ease-in-out infinite; }

        @keyframes pw-gold-glow {
          0%, 100% { box-shadow: none; border-color: var(--color-accent-gold-dim); color: var(--color-text-muted); }
          50%       { box-shadow: var(--glow-gold); border-color: var(--color-accent-gold); color: var(--color-accent-gold-bright); }
        }

        @keyframes pw-reward-slide {
          0%   { opacity: 0; transform: translateY(12px); }
          15%  { opacity: 1; transform: translateY(0); }
          80%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }

        .pw-reward-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: var(--pw-font-mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .pw-resources  { flex-direction: column !important; }
          .pw-statgrid   { grid-template-columns: repeat(2,1fr) !important; }
          .pw-navgrid    { grid-template-columns: repeat(2,1fr) !important; }
          .pw-align-grid { grid-template-columns: 1fr !important; }
          .pw-pvp-grid   { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 481px) and (max-width: 639px) {
          .pw-navgrid { grid-template-columns: repeat(4,1fr) !important; }
        }
      `}</style>

      <PWBackground variant={backgroundVariant} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--pw-font-body)',
          color: 'var(--color-text-primary)',
        }}
      >
        {/* ── Ornate sticky header ─────────────────────────────────────── */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-base) 100%)',
          borderBottom: `2px solid var(--color-border-frame)`,
          boxShadow: `inset 0 -1px 0 var(--color-border-inner), 0 2px 24px rgba(10,7,16,0.6)`,
          // Inner highlight stroke via outline trick
          outline: 'none',
        }}>
          {/* Corner ornaments */}
          <CornerGlyph style={{ top: 4, left: 4 }} />
          <CornerGlyph style={{ top: 4, right: 4, transform: 'scaleX(-1)' }} />
          <CornerGlyphFlip style={{ bottom: 4, left: 4, transform: 'scaleX(-1)' }} />
          <CornerGlyphFlip style={{ bottom: 4, right: 4 }} />

          {/* Left: wordmark + page label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
            <span style={{
              fontFamily: 'var(--pw-font-display)',
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--color-accent-gold-bright)',
              textShadow: 'var(--glow-gold)',
            }}>
              PANTHEON WARS
            </span>
            {title && (
              <span style={{
                fontFamily: 'var(--pw-font-mono)',
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginLeft: 2,
              }}>
                / {title}
              </span>
            )}
          </div>

          {/* Right: slot (logout button or back button) */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {rightSlot}
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          width: '100%',
          maxWidth: 640,
          margin: '0 auto',
          padding: '28px 20px 72px',
        }}>
          {children}
        </main>

        {/* ── Hub return link ──────────────────────────────────────────── */}
        <PWHubLink />
      </motion.div>
    </>
  )
}

import { Link } from 'react-router-dom'

export default function PWBackButton() {
  return (
    <>
      <style>{`
        @keyframes pw-cmd-glow {
          0%, 100% {
            box-shadow: none;
            border-color: var(--color-accent-gold-dim);
            color: var(--color-text-muted);
          }
          50% {
            box-shadow: var(--glow-gold);
            border-color: var(--color-accent-gold);
            color: var(--color-accent-gold-bright);
          }
        }
        .pw-back-btn {
          font-family: var(--pw-font-display, 'Cinzel', serif);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          text-decoration: none;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-accent-gold-dim);
          border-radius: 4px;
          padding: 6px 14px;
          transition: color 180ms, border-color 180ms, box-shadow 180ms;
          animation: pw-cmd-glow 3.5s ease-in-out infinite;
          display: inline-block;
        }
        .pw-back-btn:hover {
          color: var(--color-accent-gold-bright) !important;
          border-color: var(--color-accent-gold) !important;
          box-shadow: var(--glow-gold) !important;
          animation: none !important;
        }
      `}</style>
      <Link to="/games/pantheon-wars" className="pw-back-btn">
        ← Command Center
      </Link>
    </>
  )
}

import { Link } from 'react-router-dom'

export default function PWBackButton() {
  return (
    <>
      <style>{`
        @keyframes pw-cmd-glow {
          0%, 100% { box-shadow: none; border-color: rgba(255,255,255,0.1); color: rgba(240,240,248,0.38); }
          50%       { box-shadow: 0 0 10px rgba(0,200,255,0.18); border-color: rgba(0,200,255,0.38); color: rgba(0,200,255,0.8); }
        }
        .pw-back-btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(240,240,248,0.38);
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 6px 12px;
          transition: color 120ms, border-color 120ms, box-shadow 120ms;
          animation: pw-cmd-glow 2.8s ease-in-out infinite;
        }
        .pw-back-btn:hover {
          color: rgba(240,240,248,0.85) !important;
          border-color: rgba(255,255,255,0.28) !important;
          box-shadow: none !important;
          animation: none !important;
        }
      `}</style>
      <Link to="/games/pantheon-wars" className="pw-back-btn">
        ← Command Center
      </Link>
    </>
  )
}

import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'

export default function ComingSoon({ title = 'COMING SOON', message }) {
  return (
    <PWPageShell title={title} rightSlot={<PWBackButton />}>
      <div style={{
        textAlign: 'center',
        padding: '80px 20px',
        fontFamily: "'Cinzel', serif",
      }}>
        <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.4 }}>⚜</div>
        <h2 style={{ fontSize: 24, letterSpacing: 4, color: 'var(--color-text-primary)', marginBottom: 10 }}>
          COMING SOON
        </h2>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontStyle: 'italic', color: 'var(--color-text-secondary)', maxWidth: 480, margin: '0 auto', lineHeight: 1.5 }}>
          {message || 'This feature is being forged. Return soon, warrior.'}
        </p>
      </div>
    </PWPageShell>
  )
}

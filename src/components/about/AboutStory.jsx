const paragraphs = [
  `I started as a mechanical designer because I wanted to build physical things. Real parts, real assemblies, real machines. Then I learned to code so I could build the software that controls those things, the dashboards that monitor them, and the games that imagine entirely new ones. Now I do all of it — sometimes in the same week, sometimes for the same client.`,
  `Fresh Prints is the business side: product design, prototyping, and small-batch manufacturing. The personal brand is everything else — software contracting, game development, AI-assisted tooling, and content creation. They overlap because I do. A CAD project becomes a CAD viewer in the browser. A prediction model becomes a public dashboard. A game becomes a portfolio piece.`,
  `I work as a solo operator. No agency overhead, no handoffs between teams, no meetings about meetings. If you hire me, you get me — building, scoping, and shipping the work directly. That's the pitch. Everything else on this site is the proof.`,
]

export default function AboutStory() {
  return (
    <section style={{ marginBottom: 'var(--space-20)' }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-accent)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-widest)',
        marginBottom: 'var(--space-8)',
      }}>
        // THE STORY
      </p>

      <div style={{ maxWidth: 800 }}>
        {paragraphs.map((text, i) => (
          <p key={i} style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-loose)',
            marginBottom: i < paragraphs.length - 1 ? 'var(--space-6)' : 0,
          }}>
            {text}
          </p>
        ))}
      </div>
    </section>
  )
}

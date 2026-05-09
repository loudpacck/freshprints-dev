import { motion } from 'framer-motion'
import ContactForm from '@/components/contact/ContactForm'
import ContactDirect from '@/components/contact/ContactDirect'

export default function Contact() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-container">

        {/* Page header */}
        <header style={{ marginBottom: 'var(--space-16)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-widest)',
            marginBottom: 'var(--space-4)',
          }}>
            // CONTACT
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-5xl)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--space-4)',
          }}>
            GET IN TOUCH
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-normal)',
            maxWidth: 560,
          }}>
            For general questions, press, podcasting, and partnerships. Commission work flows through the <a href="/services" style={{ color: 'var(--color-text-accent)', textDecoration: 'none' }}>services page</a> — it's faster and gives me what I need to scope.
          </p>
        </header>

        {/* 2-column layout */}
        <div className="layout-two-col">
          <ContactForm />
          <ContactDirect />
        </div>

      </div>
    </motion.div>
  )
}

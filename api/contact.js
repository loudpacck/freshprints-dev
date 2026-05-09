import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'kyle@freshprints.dev'
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'noreply@freshprints.dev'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type } = req.body
  if (!type) return res.status(400).json({ error: 'Missing type' })

  try {
    let subject, html

    if (type === 'newsletter') {
      const { email } = req.body
      if (!email) return res.status(400).json({ error: 'Missing email' })
      subject = `[freshprints.dev] New dispatch subscriber`
      html = `<h2>New subscriber</h2><p>${email}</p>`
    }

    if (type === 'contact') {
      const { name, email, topic, message, subscribe } = req.body
      subject = `[freshprints.dev] Contact: ${topic}`
      html = `
        <h2>New contact message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Topic:</strong> ${topic}</p>
        <p><strong>Subscribe:</strong> ${subscribe ? 'Yes' : 'No'}</p>
        <hr/>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `
    }

    if (type === 'intake') {
      const { serviceType, scope, timeline, budget, description, email, name } = req.body
      subject = `[freshprints.dev] Commission: ${serviceType}`
      html = `
        <h2>New commission inquiry</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Service:</strong> ${serviceType}</p>
        <p><strong>Scope:</strong> ${scope}</p>
        <p><strong>Timeline:</strong> ${timeline}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        <hr/>
        <p>${description?.replace(/\n/g, '<br/>') || ''}</p>
      `
    }

    if (!subject) return res.status(400).json({ error: 'Unknown type' })

    await resend.emails.send({ from: FROM_EMAIL, to: TO_EMAIL, subject, html })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to send' })
  }
}

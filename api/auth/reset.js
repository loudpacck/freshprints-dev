import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { sql } from '../../lib/db.js'

export const config = { runtime: 'nodejs' }

const resend    = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'noreply@freshprints.dev'
const SITE_URL   = process.env.SITE_URL || 'https://www.freshprints.dev'

const OK_MSG = "If that email is registered, you'll receive a reset link shortly. Check your inbox."

// ── action=request ─────────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Missing email' })

  try {
    const userRows = await sql`SELECT id FROM pw_users WHERE email = ${email} LIMIT 1`

    // Never reveal whether email exists
    if (userRows.length === 0) return res.status(200).json({ ok: true, message: OK_MSG })

    const userId = userRows[0].id

    // Rate limit: max 3 requests per 24 hours for this user
    const countRows = await sql`
      SELECT COUNT(*) AS count FROM pw_password_reset_tokens
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '24 hours'
    `
    if (parseInt(countRows[0].count, 10) >= 3) {
      return res.status(429).json({
        error: 'too_many_requests',
        message: 'Maximum 3 reset emails per day. Try again tomorrow.',
      })
    }

    // Generate plaintext token, hash it
    const token     = randomBytes(32).toString('hex')
    const tokenHash = await bcrypt.hash(token, 12)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    const ip        = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null

    // Invalidate any existing active token (partial unique index requires this)
    await sql`
      UPDATE pw_password_reset_tokens
      SET used = TRUE
      WHERE user_id = ${userId} AND used = FALSE
    `

    // Insert new token
    await sql`
      INSERT INTO pw_password_reset_tokens (user_id, token_hash, expires_at, request_ip)
      VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()}, ${ip})
    `

    // Send reset email
    const resetUrl = `${SITE_URL}/games/pantheon-wars/reset-password?token=${token}&id=${userId}`
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your Pantheon Wars password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#07070D;color:#F0F0F8;padding:32px;border-radius:12px;">
          <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(240,240,248,0.38);margin:0 0 12px;">⚔ PANTHEON WARS ⚔</p>
          <h1 style="font-size:28px;margin:0 0 16px;color:#F5C542;">Password Reset</h1>
          <p style="color:rgba(240,240,248,0.7);line-height:1.6;margin:0 0 24px;">
            A password reset was requested for your Pantheon Wars account.<br/>
            Click the link below to set a new password.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;background:linear-gradient(135deg,#F5C542,#E8943A);color:#07070D;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin-bottom:24px;">
            Reset My Password
          </a>
          <p style="font-size:12px;color:rgba(240,240,248,0.38);margin:0 0 8px;">
            This link expires in <strong style="color:rgba(240,240,248,0.6);">1 hour</strong>.
          </p>
          <p style="font-size:12px;color:rgba(240,240,248,0.38);margin:0 0 24px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="font-size:11px;color:rgba(240,240,248,0.2);margin:0;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
            freshprints.dev — Pantheon Wars
          </p>
        </div>
      `,
    })

    return res.status(200).json({ ok: true, message: OK_MSG })
  } catch (err) {
    console.error('Reset request error:', err)
    // Return same success message to avoid leaking server errors
    return res.status(200).json({ ok: true, message: OK_MSG })
  }
}

// ── action=verify ──────────────────────────────────────────────────────────────

async function handleVerify(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token, user_id, new_password } = req.body || {}
  if (!token || !user_id || !new_password) {
    return res.status(400).json({ error: 'missing_fields', message: 'Missing required fields.' })
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'password_too_short', message: 'Password must be at least 8 characters.' })
  }

  try {
    const tokenRows = await sql`
      SELECT * FROM pw_password_reset_tokens
      WHERE user_id = ${user_id}
        AND used = FALSE
        AND expires_at > NOW()
      LIMIT 1
    `
    if (tokenRows.length === 0) {
      return res.status(400).json({ error: 'invalid_or_expired', message: 'Reset link is invalid or has expired. Request a new one.' })
    }

    const tokenRow = tokenRows[0]
    const valid = await bcrypt.compare(token, tokenRow.token_hash)
    if (!valid) {
      return res.status(400).json({ error: 'invalid_or_expired', message: 'Reset link is invalid or has expired. Request a new one.' })
    }

    const newHash = await bcrypt.hash(new_password, 12)

    // Update password, mark token used, revoke all sessions atomically-ish
    await sql`UPDATE pw_users SET password_hash = ${newHash} WHERE id = ${user_id}`
    await sql`UPDATE pw_password_reset_tokens SET used = TRUE WHERE id = ${tokenRow.id}`
    await sql`DELETE FROM pw_user_sessions WHERE user_id = ${user_id}`

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Reset verify error:', err)
    return res.status(500).json({ error: 'server_error', message: 'Something went wrong. Please try again.' })
  }
}

// ── Router ─────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const { action } = req.query
  if (action === 'request') return handleRequest(req, res)
  if (action === 'verify')  return handleVerify(req, res)
  return res.status(400).json({ error: 'Unknown action' })
}

import {
  TTL_S, PER_EMAIL_PER_DAY, PER_NET_PER_HOUR,
  now, sha256, newToken, net24, looksLikeEmail, ackPage, ACK_HEADERS,
} from '../_lib/gate'
import { html as emailHtml, text as emailText, subject } from '../_lib/cv-email'
import { notifyRequested, type SlackEnv } from '../_lib/notify'

interface Env extends SlackEnv {
  CV_DB: D1Database
  RESEND_API_KEY: string
}

/*
 * POST /api/cv
 *
 * Always 202, always the same page. Every early return below goes through the
 * same `ack()`, and that is the whole security property: an endpoint that
 * answers differently for a known address, an unknown one, a rate-limited one
 * or a bot is an enumeration oracle. Section 4.3 promises this is not one.
 *
 * Accepts form-encoded bodies because the reading path ships zero JavaScript,
 * so this is a real HTML form POST, not fetch().
 */
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const ack = () => new Response(ackPage(), { status: 202, headers: ACK_HEADERS })

  let email = ''
  let honeypot = ''
  try {
    const ct = ctx.request.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const b = (await ctx.request.json()) as Record<string, unknown>
      email = String(b.email ?? '')
      honeypot = String(b.company ?? '')
    } else {
      const f = await ctx.request.formData()
      email = String(f.get('email') ?? '')
      honeypot = String(f.get('company') ?? '')
    }
  } catch {
    return ack()
  }

  // Honeypot. A visually hidden field a human never sees and a naive bot fills.
  // Dropped silently, with the same response as everything else. PLAN 6.4.
  if (honeypot.trim() !== '') return ack()

  email = email.trim().toLowerCase()
  if (!looksLikeEmail(email) || email.length > 254) return ack()

  const db = ctx.env.CV_DB
  if (!db) return ack()

  const ip = ctx.request.headers.get('cf-connecting-ip')
  const net = net24(ip)
  const t = now()

  try {
    // Two independent limit dimensions, address and /24, as counting queries
    // against an index rather than a second datastore. PLAN 6.2.
    const perEmail = await db
      .prepare('SELECT count(*) AS n FROM cv_token WHERE email = ?1 AND issued_at > ?2')
      .bind(email, t - 86_400).first<{ n: number }>()
    if ((perEmail?.n ?? 0) >= PER_EMAIL_PER_DAY) return ack()

    if (net) {
      const perNet = await db
        .prepare('SELECT count(*) AS n FROM cv_token WHERE src_net = ?1 AND issued_at > ?2')
        .bind(net, t - 3_600).first<{ n: number }>()
      if ((perNet?.n ?? 0) >= PER_NET_PER_HOUR) return ack()
    }

    const token = newToken()
    const hash = await sha256(token)

    await db
      .prepare(`INSERT INTO cv_token (token_hash, email, issued_at, expires_at, src_net)
                VALUES (?1, ?2, ?3, ?4, ?5)`)
      .bind(hash, email, t, t + TTL_S, net).run()

    const url = `https://mosthofaimran.com/cv/${token}`
    const vars = { url, ttlSeconds: TTL_S }

    // Mail is sent after the response is committed. The requester should not
    // wait on Resend, and a mail failure must not change the status code, which
    // would reintroduce the oracle by timing.
    ctx.waitUntil(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ctx.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Mosthofa Imran <hey@mosthofaimran.com>',
          to: [email],
          reply_to: 'hey@mosthofaimran.com',
          subject: subject(),
          html: emailHtml(vars),
          text: emailText(vars),
        }),
      }).catch(() => undefined),
    )

    // Slack, after the response, for the same reason the mail is. This one
    // carries the address on purpose: an alert that will not say who asked is
    // not worth reading. Section 6.2 and the processor table in 6.6 both say the
    // address comes here, corrected the day the secret was set. Erratum 7.26.
    ctx.waitUntil(Promise.resolve(notifyRequested(ctx.env, email)))
  } catch {
    // A database failure must not tell the caller anything either.
    return ack()
  }

  return ack()
}

// Anything but POST on this path. GET especially, since a crawler will try it.
export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method === 'POST') return ctx.next()
  return new Response('405 Method Not Allowed. This endpoint takes a POST from the form at /cv/.', {
    status: 405,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'POST', 'X-Robots-Tag': 'noindex' },
  })
}

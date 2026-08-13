import { looksLikeEmail, ackPage, ACK_HEADERS } from '../../_lib/gate'

interface Env { CV_DB: D1Database }

// Section 6.4 promises same-day deletion. A promise needs an endpoint.
// Same always-202 rule: confirming whether rows existed would leak the thing
// the endpoint is meant to protect.
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const ack = () => new Response(ackPage(), { status: 202, headers: ACK_HEADERS })
  try {
    const ct = ctx.request.headers.get('content-type') || ''
    let email = ''
    if (ct.includes('application/json')) {
      email = String(((await ctx.request.json()) as any)?.email ?? '')
    } else {
      email = String((await ctx.request.formData()).get('email') ?? '')
    }
    email = email.trim().toLowerCase()
    if (looksLikeEmail(email) && ctx.env.CV_DB) {
      await ctx.env.CV_DB.prepare('DELETE FROM cv_token WHERE email = ?1').bind(email).run()
    }
  } catch { /* same answer either way */ }
  return ack()
}

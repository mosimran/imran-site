import { sha256, now } from '../_lib/gate'
import { notifyViewed, type SlackEnv } from '../_lib/notify'

interface Env extends SlackEnv {
  CV_DB: D1Database
  // KV rather than R2. The requirement is that the file has no public URL and
  // is streamed by the function; KV satisfies that identically for a 430 KB
  // object, and unlike R2 it is grantable through wrangler's OAuth. R2 would
  // matter for a large file or for range requests. This is neither.
  CV_FILE?: KVNamespace
}

const PDF_KEY = 'mosthofa-imran-cv.pdf'

const plain = (status: number, body: string, extra: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      ...extra,
    },
  })

/*
 * GET /cv/:token
 *
 * The token is the capability. The file is never addressable without one and
 * never sits at a public URL.
 *
 * The token stopped burning on first read on 2026-09-03. It is valid for its
 * whole 24 hour life and every open is counted. The reason is delivery: a
 * single-use link sent by email is destroyed by the mail security that scans
 * it, and Defender, Proofpoint and Mimecast all fetch URLs before the human
 * sees them. The old behaviour meant a recruiter behind corporate mail got
 * "already used" for a link nobody had opened. Erratum 7.24.
 *
 * The file is still checked BEFORE the token is touched, which mattered more
 * when the read was destructive and is kept because a 503 that also consumed
 * something would still be the wrong answer.
 */
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const token = String(ctx.params.token ?? '')
  if (!token || token.length < 20 || token.length > 128) {
    return plain(410, '410 Gone. This link has expired or was revoked. Request another at https://mosthofaimran.com/cv/, no penalty attached.')
  }

  const db = ctx.env.CV_DB
  if (!db) return plain(503, '503. The gate is not configured. Write to hey@mosthofaimran.com and the file comes back by hand.')

  // Check the file first. Nothing is burned if there is nothing to give.
  const store = ctx.env.CV_FILE
  let body: ReadableStream | null = null
  if (store) body = await store.get(PDF_KEY, 'stream')
  if (!store || !body) {
    return plain(503, [
      '503 Service Unavailable.',
      '',
      'The token machinery is live but the document is not published yet, so nothing was',
      'consumed: your link still works and will keep working until it expires.',
      '',
      'Write to hey@mosthofaimran.com and it comes back by hand. Section 6.5 lists that',
      'path first anyway.',
    ].join('\n'), { 'Retry-After': '86400' })
  }

  const hash = await sha256(token)

  /*
   * One statement decides validity and counts the view. `changes === 1` means
   * the token exists, is unrevoked and is unexpired. COALESCE keeps
   * `redeemed_at` pointing at the first open rather than the latest, so the
   * "time to first read" signal survives the change to multi-view.
   */
  const res = await db
    .prepare(`UPDATE cv_token SET redeemed_at = COALESCE(redeemed_at, ?1), views = views + 1
               WHERE token_hash = ?2 AND revoked = 0 AND expires_at > ?1`)
    .bind(now(), hash).run()

  if ((res.meta?.changes ?? 0) !== 1) {
    return plain(410, '410 Gone. This link has expired or was revoked. Request another at https://mosthofaimran.com/cv/, no penalty attached.')
  }

  // Structured, and no PII on the line. Detecting a forward is the stated
  // purpose in 6.4; identifying the reader is not.
  const row = await db
    .prepare('SELECT id, views FROM cv_token WHERE token_hash = ?1')
    .bind(hash).first<{ id: number; views: number }>()
  console.log(JSON.stringify({ evt: 'cv.viewed', id: row?.id ?? null, views: row?.views ?? null }))
  ctx.waitUntil(Promise.resolve(notifyViewed(ctx.env, row?.id ?? null, row?.views ?? 1)))

  return new Response(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="mosthofa-imran-cv.pdf"',
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}

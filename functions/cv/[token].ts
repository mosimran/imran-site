import { sha256, now } from '../_lib/gate'

interface Env {
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
 * Order matters and is deliberate: the file is checked BEFORE the token is
 * burned. A token is single use, so consuming one and then discovering there is
 * nothing to serve would destroy a capability for nothing and leave the
 * requester with a dead link and no recourse.
 */
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const token = String(ctx.params.token ?? '')
  if (!token || token.length < 20 || token.length > 128) {
    return plain(410, '410 Gone. Token already used or expired. Request another at https://mosthofaimran.com/cv/, no penalty attached.')
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
   * Single atomic burn by compare-and-set on `changes`, not RETURNING.
   * Two simultaneous requests: exactly one sees changes === 1.
   */
  const res = await db
    .prepare(`UPDATE cv_token SET redeemed_at = ?1
               WHERE token_hash = ?2 AND redeemed_at IS NULL
                 AND revoked = 0 AND expires_at > ?1`)
    .bind(now(), hash).run()

  if ((res.meta?.changes ?? 0) !== 1) {
    return plain(410, '410 Gone. Token already used or expired. Request another at https://mosthofaimran.com/cv/, no penalty attached.')
  }

  // Structured, and no PII on the line. Detecting a forward is the stated
  // purpose in 6.4; identifying the reader is not.
  const row = await db.prepare('SELECT id FROM cv_token WHERE token_hash = ?1').bind(hash).first<{ id: number }>()
  console.log(JSON.stringify({ evt: 'cv.redeemed', id: row?.id ?? null }))

  return new Response(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="mosthofa-imran-cv.pdf"',
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}

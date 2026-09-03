// Slack notification for the résumé gate. Added 2026-09-03 at the owner's
// request: before it, a request produced one email to the requester and a
// redemption produced a log line, so neither event reached him at all.
//
// Three rules, and they are the reason this file is separate from the handlers.
//
// 1. It never changes a response. Every call is wrapped in waitUntil and every
//    failure is swallowed. Section 4.3 promises /api/cv answers identically for
//    every input, and an outbound call that can fail is an oracle by timing if
//    the caller waits on it.
// 2. It carries the address on request, because knowing who asked is the whole
//    point of the alert. Sections 6.2 and 6.6 say so. They were corrected on the
//    day the secret was set rather than the day this code shipped, which is
//    erratum 7.26: the disclosure lands with the behaviour, never before it.
// 3. It carries no address on redemption. Section 6.4's stated purpose there is
//    detecting a forward, not identifying the reader, and a row id plus a view
//    count answers that without naming anybody.

export interface SlackEnv {
  SLACK_WEBHOOK_URL?: string
}

const post = (url: string, text: string) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch(() => undefined)

/** A link was requested. Carries the address, deliberately. */
export function notifyRequested(env: SlackEnv, email: string): Promise<unknown> | undefined {
  if (!env.SLACK_WEBHOOK_URL) return undefined
  return post(env.SLACK_WEBHOOK_URL, `CV link requested by ${email}`)
}

/**
 * A link was opened. Carries a row id and a view count and no address.
 *
 * The count is the signal worth having: the token is valid for its whole 24
 * hours now rather than burning on first read, so a second view is either the
 * same person reopening it or somebody they forwarded it to. Neither is an
 * incident. A tenth view is a different conversation.
 */
export function notifyViewed(env: SlackEnv, id: number | null, views: number): Promise<unknown> | undefined {
  if (!env.SLACK_WEBHOOK_URL) return undefined
  const suffix = views > 1 ? ` (view ${views} of this link)` : ''
  return post(env.SLACK_WEBHOOK_URL, `CV opened, token ${id ?? 'unknown'}${suffix}`)
}

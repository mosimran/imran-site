// Shared bits of Section 6. PLAN section 6.

export const TTL_S = 86_400
export const PER_EMAIL_PER_DAY = 3
export const PER_NET_PER_HOUR = 60

export const now = () => Math.floor(Date.now() / 1000)

export async function sha256(s: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
}

export function newToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32))   // 256 bits, not guessable
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Truncate to /24 before it is ever written. IPv6 keeps its first four groups.
export function net24(ip: string | null): string {
  if (!ip) return ''
  if (ip.includes(':')) return ip.split(':').slice(0, 4).join(':') + '::'
  const p = ip.split('.')
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0` : ''
}

export const looksLikeEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)

/*
 * The acknowledgement page.
 *
 * It MUST be byte-identical for a valid address, a rate-limited one, a
 * malformed one and a honeypot hit. Section 4.3 promises this endpoint is not
 * an enumeration oracle, and an endpoint that answers differently is exactly
 * that. There is deliberately no branch in this function.
 *
 * It is a page and not a JSON body because the reading path ships zero bytes of
 * JavaScript, so the form is a real HTML POST and the browser renders whatever
 * comes back.
 */
export function ackPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex">
<title>202 Accepted</title>
<style>
:root{--paper:#fdfdfb;--ink:#14171a;--dim:#586470;--rule:#e3e7eb;--accent:#0a6a67;
--mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;
--text:"Charter","Iowan Old Style",ui-serif,Georgia,serif}
@media(prefers-color-scheme:dark){:root{--paper:#0d1013;--ink:#dde2e6;--dim:#8d97a1;
--rule:#222a31;--accent:#4fbdb6}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--mono);
font-size:14px;line-height:1.7}
.p{max-width:660px;margin:0 auto;padding:60px 24px 96px}
.ep{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700}
h1{font-size:17px;letter-spacing:.02em;text-transform:uppercase;margin:14px 0 22px;
padding-bottom:14px;border-bottom:1px solid var(--rule)}
p{font-family:var(--text);font-size:17px;line-height:1.58;max-width:60ch;margin:0 0 16px}
.d{color:var(--dim);font-size:15px}
a{color:var(--accent);text-decoration:none;border-bottom:1px solid var(--rule)}
</style>
</head>
<body><div class="p">
<div class="ep">202 Accepted</div>
<h1>Request received</h1>
<p>If that address was well formed and inside the rate limit, a single-use link is on its
way. It expires in 24 hours.</p>
<p class="d">This page says the same thing whatever happened, on purpose. Answering
differently for a known address, an unknown one or a rate-limited one would turn this
endpoint into a way to test whether an address exists, and Section 6.4 promises it is
not that.</p>
<p class="d">Nothing arrived after a few minutes? Write to
<a href="mailto:hey@mosthofaimran.com">hey@mosthofaimran.com</a> and it comes back by
hand. Section 6.5 lists that path first anyway.</p>
<p class="d"><a href="/cv/">Back to Section 6</a></p>
</div></body>
</html>`
}

export const ACK_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, private',
  'X-Robots-Tag': 'noindex, nofollow',
}

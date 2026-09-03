// The résumé gate, checked after deploy without burning anything.
//
// It is the only functional capability on this site, the only thing with an
// attack surface, and the thing security.txt invites reports about. Nothing
// verified it. check-a11y.mjs loads /cv/, but that page is static HTML and
// passes identically whether the backend behind it works or is entirely absent.
// The same gap that hid a 404 on security.txt for three weeks, erratum 7.23.
//
// The probe is non-destructive by construction, and it works because of a
// deliberate ordering in functions/cv/[token].ts: the file is fetched BEFORE the
// token is burned, so a token that cannot exist still exercises both bindings.
//
//   404 or 5xx on /cv/       the page itself is gone
//   503 "not configured"     the D1 binding is missing
//   503 "not published yet"  D1 is bound and the PDF is absent from KV
//   410                      both bindings are healthy, nothing consumed
//
// An UPDATE that matches no row changes nothing, so no capability is spent.
import { randomBytes } from 'node:crypto'

const HOSTS = (process.argv[2] || process.env.AUDIT_BASE || 'https://mosthofaimran.com')
  .split(',').map((h) => h.trim().replace(/\/$/, '')).filter(Boolean)

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

const failures = []
const pass = (label, ok, detail) => {
  console.log(`  ${ok ? 'ok ' : 'FAIL'} ${label.padEnd(40)} ${detail}`)
  if (!ok) failures.push(label)
}

const get = async (url) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  return { status: r.status, body: await r.text() }
}

console.log(`\nrésumé gate\n  hosts ${HOSTS.join(', ')}\n`)

for (const base of HOSTS) {
  console.log(`  ${base}`)
  try {
    const page = await get(`${base}/cv/`)
    pass('/cv/ serves the request form', page.status === 200 && /<form/i.test(page.body), String(page.status))

    // 32 random hex characters. Inside the accepted length band, and the chance
    // of colliding with a live token is not worth writing a sentence about.
    const probe = randomBytes(16).toString('hex')
    const res = await get(`${base}/cv/${probe}`)
    const hint = res.status === 503
      ? (/not configured/i.test(res.body) ? '503, D1 binding missing' : '503, PDF missing from KV')
      : String(res.status)
    pass('unknown token is refused, nothing burned', res.status === 410, hint)
  } catch (e) {
    pass('gate reachable', false, e.message)
  }
  console.log('')
}

if (failures.length) {
  console.error(`gate check FAILED: ${failures.join(', ')}\n`)
  console.error('A 503 here means the gate is live and cannot serve. Section 6 promises this')
  console.error('file and security.txt invites reports about it, so a broken gate is a broken')
  console.error('promise rather than a broken page.\n')
  process.exit(1)
}
console.log('the gate answers, and no token was consumed to find out\n')

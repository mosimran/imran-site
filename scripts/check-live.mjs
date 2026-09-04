// The zero-JavaScript and zero-third-party budgets, asserted against what the
// edge actually serves to a browser.
//
// check-budget.mjs reads dist/. That is necessary and not sufficient: it cannot
// see anything the CDN injects on the way out. Cloudflare has two features that
// rewrite HTML in flight, Email Address Obfuscation and Web Analytics, and both
// add a <script> this document forbids.
//
// The trap is that they inject on browser-shaped requests only. A plain `curl`
// gets clean HTML and reports success, which is how a live violation survived
// several rounds of checking here: dist/ was clean, curl was clean, and a real
// browser was served a third-party module script on every page load. So this
// sends a browser User-Agent and Accept header on purpose.

// Every host that actually serves this site, because the zero-JavaScript and
// zero-third-party claims are made about the site rather than about one hostname.
// Checking only the primary was the same shape of gap as a provenance scan that
// reads one field: a clean result that covers less than it appears to.
//
// Verified 2026-09-03 by request rather than from the plan: the beacon is injected
// on the mosthofaimran.com zone alone. imran.com.bd is clean, and so is
// imran-site.pages.dev, so the source is that one zone's Web Analytics and not the
// Pages project. johnefemer.com is a parking lander and is deliberately not listed
// here; PLAN section 2 records why.
// An argument or AUDIT_BASE may name several hosts, comma separated. Taking only
// the first was a real defect for one commit: the workflow passes an explicit
// host, so CI kept checking the primary alone while this file and its worklog
// entry both claimed the gap was closed. Verified in the CI log, not assumed.
const DEFAULT_HOSTS = ['https://mosthofaimran.com', 'https://imran.com.bd']
const given = process.argv[2] || process.env.AUDIT_BASE
const BASES = given
  ? given.split(',').map((h) => h.trim().replace(/\/$/, '')).filter(Boolean)
  : DEFAULT_HOSTS
const PATHS = ['/', '/papers/', '/papers/retry-storm/', '/errata/']

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

// Same allowance as check-budget.mjs: these are referenced, never fetched to render.
const ALLOWED_OFF_ORIGIN = [/creativecommons\.org/, /github\.com/, /mosthofaimran\.com/]

// The one exception, and it is a disclosure rather than a silencing. Cloudflare
// Web Analytics injects this beacon into every HTML response and there is no way
// to keep it off without turning the feature off. The owner chose to keep the
// feature on 2026-09-03, so sections 8, 10 and Appendix B were corrected to say
// so and section 6.6 names Cloudflare as a processor. Erratum 7.25.
//
// It is pinned to the exact host and the exact filename. A second third-party
// script, or this one moving, still fails. The check that has been red since
// erratum 7.6 is not being switched off, it is being narrowed to what was
// actually decided.
const BEACON = /^https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js/

const failures = []
const pass = (label, ok, detail) => {
  console.log(`  ${ok ? 'ok ' : 'FAIL'} ${label.padEnd(44)} ${detail}`)
  if (!ok) failures.push(label)
}

console.log(`\nlive budgets, as served to a browser\n  hosts ${BASES.join(', ')}\n`)

for (const BASE of BASES) {
console.log(`  ${BASE}`)
for (const path of PATHS) {
  const url = `${BASE}${path}`
  // Retried, because this runs straight after a deploy and an edge that has not
  // caught up yet is not the same thing as a budget breach.
  let res, html
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        redirect: 'follow',
      })
      html = await res.text()
      if (res.status === 200) break
    } catch (e) {
      res = null
      if (attempt === 3) {
        console.error(`  FAIL ${path} could not be fetched: ${e.message}`)
        failures.push(`${path} unreachable`)
      }
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 5000))
  }
  if (!res) continue

  console.log(`  ${path}`)
  pass('http status', res.status === 200, String(res.status))

  // Every <script> must be application/ld+json. Anything else is executable
  // code in the reading path, whether this repository put it there or not.
  const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)].map((m) => m[1])
  const executable = scripts
    .filter((attrs) => !/type=["']application\/ld\+json["']/i.test(attrs))
    .filter((attrs) => !BEACON.test((attrs.match(/src=["']([^"']+)["']/i) || [])[1] || ''))
  pass('executable script tags, beacon excepted', executable.length === 0, `${executable.length} unexpected of ${scripts.length}`)
  for (const attrs of executable) {
    const src = (attrs.match(/src=["']([^"']+)["']/i) || [])[1] || '(inline)'
    console.log(`       -> ${src}`)
  }

  // Third-party requests, same rule as the build-time budget.
  const offOrigin = new Set()
  for (const m of html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)["']/gi)) {
    if (BEACON.test(m[1])) continue
    if (!ALLOWED_OFF_ORIGIN.some((re) => re.test(m[1]))) offOrigin.add(new URL(m[1]).host)
  }
  pass('third-party hosts', offOrigin.size === 0, offOrigin.size ? [...offOrigin].join(', ') : '0')

  console.log('')
}

// The address the site gives security researchers has to be reachable at the
// address it gives them. check-links.mjs reads dist/, where the file has always
// existed, so it reported zero broken links for three weeks while the live URL
// returned 404. Same shape as erratum 7.6: a correct check measuring the wrong
// artifact. Erratum 7.23.
{
  const url = `${BASE}/.well-known/security.txt`
  let ok = false, detail = 'unreachable', expires = null
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    const body = r.ok ? await r.text() : ''
    ok = r.ok && /^Contact:/m.test(body)
    detail = r.ok ? `${r.status}, ${body.split('\n').filter((l) => l.startsWith('Canonical:')).length} canonical lines` : String(r.status)
    expires = (body.match(/^Expires:\s*(\S+)/m) || [])[1] ?? null
  } catch (e) {
    detail = e.message
  }
  console.log(`  /.well-known/security.txt`)
  pass('served and has a Contact line', ok, detail)

  // RFC 9116 says a researcher should treat an expired file as stale, so an
  // expiry that passes turns this from a disclosure route into a dead one. The
  // file sat at 404 for three weeks because nothing looked at it (erratum 7.23);
  // letting the date lapse would be the same failure with a different mechanism.
  // P14 has wanted a reminder that outlives the file since 2026-08-13.
  if (expires) {
    const days = Math.floor((Date.parse(expires) - Date.now()) / 86_400_000)
    pass('security.txt is not expired', days > 0, `${days} days left, ${expires}`)
    if (days > 0 && days < 45) console.log(`       -> rotate it: under 45 days remain`)
  } else {
    pass('security.txt names an Expires', false, 'no Expires field')
  }
  console.log('')
}

// Short links, on the host that is actually serving.
//
// A short link is the one URL on this site that is printed on paper and read
// aloud, so it is the one that hurts most when it silently stops working. It
// lives in dist/_redirects, which no local check can execute: only the edge
// knows whether the rule was shipped and honoured. check-short.mjs proves the
// file says the right thing, and this proves the file is being obeyed.
//
// The Location must be a path. An absolute one would send imran.com.bd traffic
// to the primary and turn an alias that serves into an alias that redirects,
// which is the arrangement PLAN section 2.1 deliberately does not use.
{
  const code = '5-14'
  const want = '/papers/kubernetes-for-a-bicycle/'
  let status = 0, location = null, detail = 'unreachable'
  try {
    const r = await fetch(`${BASE}/l/${code}`, { headers: { 'User-Agent': UA }, redirect: 'manual' })
    status = r.status
    location = r.headers.get('location')
    detail = `${status} -> ${location ?? 'no Location'}`
  } catch (e) {
    detail = e.message
  }
  console.log(`  /l/${code}`)
  pass('short link is a 301 to the paper', status === 301 && location === want, detail)
  pass('Location is a path, so the host is kept', !/^https?:/i.test(location ?? ''), location ?? 'none')
  console.log('')
}
}

if (failures.length) {
  console.error(`live check FAILED: ${failures.join(', ')}\n`)
  console.error('The Cloudflare Web Analytics beacon is expected and excepted by name. Any')
  console.error('other script or host here is a new third party, and sections 8, 10 and')
  console.error('Appendix B would need correcting before it could be allowed. See erratum')
  console.error('7.25 for why the beacon was kept rather than removed.\n')
  process.exit(1)
}
console.log('every checked page serves zero executable script and zero third-party hosts\n')

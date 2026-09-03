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
  const executable = scripts.filter((attrs) => !/type=["']application\/ld\+json["']/i.test(attrs))
  pass('executable script tags', executable.length === 0, `${executable.length} of ${scripts.length} script tags`)
  for (const attrs of executable) {
    const src = (attrs.match(/src=["']([^"']+)["']/i) || [])[1] || '(inline)'
    console.log(`       -> ${src}`)
  }

  // Third-party requests, same rule as the build-time budget.
  const offOrigin = new Set()
  for (const m of html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)["']/gi)) {
    if (!ALLOWED_OFF_ORIGIN.some((re) => re.test(m[1]))) offOrigin.add(new URL(m[1]).host)
  }
  pass('third-party hosts', offOrigin.size === 0, offOrigin.size ? [...offOrigin].join(', ') : '0')

  console.log('')
}
}

if (failures.length) {
  console.error(`live check FAILED: ${failures.join(', ')}\n`)
  console.error('If this names static.cloudflareinsights.com: Web Analytics is enabled on the')
  console.error('mosthofaimran.com zone and injects a beacon into browser-shaped requests.')
  console.error('Narrowed 2026-09-03 to that one zone. imran.com.bd and imran-site.pages.dev')
  console.error('are both clean, so it is not the Pages project and not a shared setting.')
  console.error('The fix is one toggle: Cloudflare dashboard, the mosthofaimran.com zone,')
  console.error('Analytics and Logs, Web Analytics, off. The CLI cannot do it, because the')
  console.error('wrangler OAuth token holds zone (read) and no RUM scope. See PLAN.md 13.3')
  console.error('and erratum 7.6.\n')
  process.exit(1)
}
console.log('every checked page serves zero executable script and zero third-party hosts\n')

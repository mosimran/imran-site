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

const BASE = (process.argv[2] || process.env.AUDIT_BASE || 'https://mosthofaimran.com').replace(/\/$/, '')
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

console.log(`\nlive budgets, as served to a browser\n  base ${BASE}\n`)

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

if (failures.length) {
  console.error(`live check FAILED: ${failures.join(', ')}\n`)
  console.error('If this names static.cloudflareinsights.com, Web Analytics is enabled on the')
  console.error('zone and is injecting a beacon. Turn it off in the dashboard: the setting is')
  console.error('per zone under Analytics, and per project under Pages. See docs/PLAN.md 13.3.\n')
  process.exit(1)
}
console.log('every checked page serves zero executable script and zero third-party hosts\n')

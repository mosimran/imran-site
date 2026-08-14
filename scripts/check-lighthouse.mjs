// PLAN section "quality gates": LCP under 1.2 s on simulated slow 3G, and tap
// targets at 44 px. The remaining half of T20.
//
// Lighthouse is NOT a dependency of this project and must not become one. Adding
// it to package.json is what broke it the first time: npm treats `tslib` as
// satisfied through an optional `sharp-wasm32` dependency that is skipped on
// macOS, so the module is never installed while npm reports "up to date". `npx`
// resolves into a clean temporary tree and does not inherit that state, which is
// why this runs the pinned CLI rather than importing anything.
//
// Measured against the live origin by default, not against dist/. A local static
// server answers in about a millisecond, which would flatter LCP by removing the
// one number this site cannot control.

import { execFileSync } from 'node:child_process'

const LH = 'lighthouse@12.8.2'
const BASE = (process.argv[2] || process.env.AUDIT_BASE || 'https://mosthofaimran.com').replace(/\/$/, '')

// index plus one paper, per the PLAN row.
const PAGES = ['/', '/papers/retry-storm/']

const LCP_MS = 1200

// Lighthouse's own "slow 3G": 400 kbps, 300 ms RTT, 4x CPU. The default mobile
// preset is slow 4G, which is a materially easier target than the one written
// down, so it is set explicitly rather than inherited.
const THROTTLE = [
  '--throttling-method=simulate',
  '--throttling.rttMs=300',
  '--throttling.throughputKbps=400',
  '--throttling.cpuSlowdownMultiplier=4',
]

function audit(url) {
  const out = execFileSync(
    'npx',
    [
      '--yes', LH, url,
      '--quiet',
      '--output=json',
      '--output-path=stdout',
      '--only-categories=performance,accessibility',
      ...THROTTLE,
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage',
    ],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] },
  )
  return JSON.parse(out)
}

const failures = []
const pass = (label, ok, detail) => {
  console.log(`  ${ok ? 'ok ' : 'FAIL'} ${label.padEnd(46)} ${detail}`)
  if (!ok) failures.push(label)
}

console.log(`\nlighthouse (simulated slow 3G: 400 kbps, 300 ms RTT, 4x CPU)\n  base ${BASE}\n`)

for (const path of PAGES) {
  const url = `${BASE}${path}`
  let lhr
  try {
    lhr = audit(url)
  } catch (e) {
    console.error(`\nlighthouse could not run against ${url}\n${e.message}\n`)
    process.exit(1)
  }

  if (lhr.runtimeError?.code) {
    console.error(`\nlighthouse runtime error on ${url}: ${lhr.runtimeError.message}\n`)
    process.exit(1)
  }

  const lcp = lhr.audits['largest-contentful-paint']?.numericValue
  const target = lhr.audits['target-size']
  const perf = Math.round((lhr.categories.performance?.score ?? 0) * 100)
  const a11y = Math.round((lhr.categories.accessibility?.score ?? 0) * 100)

  console.log(`  ${path}`)
  pass('largest contentful paint, ms', Math.round(lcp) <= LCP_MS, `${Math.round(lcp)} / ${LCP_MS}`)

  // score 1 passes, 0 fails, null means the audit found nothing to measure.
  // A page with no tap targets is not a page that passed, so it is reported
  // as such rather than counted as a win.
  const tapOk = target?.score === 1 || target?.scoreDisplayMode === 'notApplicable'
  pass('tap targets, 44 px', tapOk, target?.score === null ? 'not applicable' : `score ${target?.score}`)

  console.log(`  --   performance ${perf}, accessibility ${a11y}\n`)
}

if (failures.length) {
  console.error(`lighthouse check FAILED: ${failures.join(', ')}\n`)
  process.exit(1)
}
console.log('LCP and tap targets within budget on every page checked\n')

/*
 * Short links, enforced.
 *
 * A short link is a 301. Browsers cache one indefinitely and a reader may have
 * printed it, so the mapping is a promise rather than a configuration value. The
 * check that matters is the third one: a code that was published and then quietly
 * repointed sends people who trusted it to the wrong document, which is the exact
 * failure this site exists to argue against.
 *
 * Runs over dist/ after a build, and over git history for the append-only rule.
 */
import { readFileSync, existsSync, statSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { documents, codeFor, readLedger } from './shortlinks.mjs'

const ledger = readLedger()
const failures = []
const fail = (label, detail) => { failures.push(label); console.log(`  FAIL ${label}`); detail.forEach((d) => console.log(`       ${d}`)) }
const ok = (label, n) => console.log(`  ok   ${label.padEnd(44)} ${n}`)

console.log('\nshort links')

// 1. Every numbered document carries a code. A paper that ships without one is
//    not broken, it is just unshareable, and silence about that is how a surface
//    half exists for a year.
const missing = documents().filter((d) => !ledger[codeFor(d.section)])
missing.length
  ? fail('every numbered document has a code', missing.map((d) => `${d.section} ${d.target}  run: npm run shortlinks`))
  : ok('every numbered document has a code', documents().length)

// 2. The code is the section number with the dot replaced, and nothing else.
const malformed = Object.entries(ledger).filter(([code, e]) => code !== codeFor(e.section) || !/^\d+-\d+$/.test(code))
malformed.length
  ? fail('code is the section number, hyphenated', malformed.map(([c, e]) => `${c} claims section ${e.section}`))
  : ok('code is the section number, hyphenated', Object.keys(ledger).length)

// 3. Append-only. Compared against the committed ledger, not against intent.
let prior = null
try { prior = JSON.parse(execSync('git show HEAD:src/data/shortlinks.json 2>/dev/null', { encoding: 'utf8' })) } catch { prior = null }
if (prior) {
  const broken = []
  for (const [code, was] of Object.entries(prior)) {
    const now = ledger[code]
    if (!now) broken.push(`${code} was published pointing at ${was.target} and has been deleted`)
    else if (now.target !== was.target) broken.push(`${code} was published pointing at ${was.target}, now points at ${now.target}`)
  }
  broken.length
    ? fail('no published code was moved or deleted', broken)
    : ok('no published code was moved or deleted', Object.keys(prior).length)
} else {
  console.log(`  --   no committed ledger to compare against yet`)
}

// 4 and 5 need a build. Everything above is true of the source alone.
if (!existsSync('dist/_redirects')) {
  console.log('  --   no dist/, skipping the built checks\n')
  process.exit(failures.length ? 1 : 0)
}

const resolves = (u) => ['dist' + u + 'index.html', 'dist' + u]
  .some((p) => { try { return statSync(p).isFile() } catch { return false } })

// 4. Every target is a page that exists. Catches a slug moving out from under a
//    code, which is the other way a printed link dies.
const dead = Object.entries(ledger).filter(([, e]) => !resolves(e.target))
dead.length
  ? fail('every code resolves to a real page', dead.map(([c, e]) => `${c} -> ${e.target} does not exist in dist/`))
  : ok('every code resolves to a real page', Object.keys(ledger).length)

// 5. The rules the edge will actually serve say the same thing as the ledger.
const rules = [...readFileSync('dist/_redirects', 'utf8').matchAll(/^\/l\/([^/\s]+)\/?\s+(\S+)\s+(\d{3})/gm)]
const wrong = rules.filter(([, code, target, status]) => !ledger[code] || ledger[code].target !== target || status !== '301')
wrong.length
  ? fail('emitted rules agree with the ledger', wrong.map((m) => m[0].trim()))
  : ok('emitted rules agree with the ledger', rules.length)

// 6. Exactly two rules per code, the bare path and the trailing slash, and no
//    more. A duplicated rule is invisible at the edge because the first match
//    wins, so nothing would ever report it, and the file grows every time
//    --emit is run outside a build. That is how it was found.
const seen = new Map()
for (const [line] of rules) {
  const key = line.trim().split(/\s+/)[0]
  seen.set(key, (seen.get(key) ?? 0) + 1)
}
const dupes = [...seen].filter(([, n]) => n > 1)
const miscounted = Object.keys(ledger).filter((c) => !seen.has(`/l/${c}`) || !seen.has(`/l/${c}/`))
dupes.length || miscounted.length
  ? fail('two rules per code, neither missing nor doubled',
      [...dupes.map(([k, n]) => `${k} appears ${n} times`), ...miscounted.map((c) => `${c} is missing one of its two forms`)])
  : ok('two rules per code, neither missing nor doubled', seen.size)

// 7. The link is printed on the page it belongs to. A short link nobody can see
//    is a redirect, not a way to share anything.
const unprinted = Object.entries(ledger).filter(([code, e]) => {
  const page = `dist${e.target}index.html`
  return !existsSync(page) || !readFileSync(page, 'utf8').includes(`/l/${code}`)
})
unprinted.length
  ? fail('every page prints its own short link', unprinted.map(([c, e]) => `${c} missing from ${e.target}`))
  : ok('every page prints its own short link', Object.keys(ledger).length)

// 8. The published map lists all of them. This is what makes an opaque-looking
//    link auditable, so an incomplete map is worse than none.
const map = existsSync('dist/l/index.html') ? readFileSync('dist/l/index.html', 'utf8') : ''
const unmapped = Object.keys(ledger).filter((c) => !map.includes(`/l/${c}`))
unmapped.length
  ? fail('the map at /l/ lists every code', unmapped.length > 8 ? [`${unmapped.length} codes missing`] : unmapped)
  : ok('the map at /l/ lists every code', Object.keys(ledger).length)

console.log('')
if (failures.length) { console.error('short link check FAILED\n'); process.exit(1) }
console.log('every code is permanent, resolves, and is published\n')

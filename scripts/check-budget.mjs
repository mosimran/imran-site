// BUILD.md section 6, enforced. A budget nobody enforces is a preference.
//
// Runs over dist/ after a build. Every failure prints the actual number against
// the limit, because "over budget" without the figure is the kind of error
// message this site argues against.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://mosthofaimran.com'

const LIMITS = {
  indexHtml: 60_000,
  css: 12_000,
  scripts: 0,
  offOrigin: 0,
  fontFace: 0,
}

/*
 * This check used to match `src=` or `href=` on any element, which counted a
 * hyperlink as a third-party request. It is not one: nothing is fetched until a
 * reader clicks and leaves. The allow-list below was three hostnames bolted on
 * to work around that, and its own comment said so.
 *
 * The budget claims zero third-party requests, so the check now looks at the
 * attributes that actually cause the browser to fetch something while rendering
 * the page, and at url() inside the inlined CSS. Outbound links are counted
 * separately and reported rather than gated.
 *
 * This is the eighth time on this site that a check was confirming something
 * true and adjacent to what it claimed to measure. See erratum 7.44.
 */
const FETCHING = [
  // <link href> pulls stylesheets, preloads, prefetches and icons.
  /<link\b[^>]*\bhref="(https?:\/\/[^"]+)"/gi,
  // src on img, script, iframe, audio, video, source, embed, track.
  /<(?:img|script|iframe|audio|video|source|embed|track|input)\b[^>]*\bsrc="(https?:\/\/[^"]+)"/gi,
  // srcset and imagesrcset carry candidate URLs.
  /<[^>]*\b(?:image)?srcset="([^"]*https?:\/\/[^"]*)"/gi,
  // poster on video, data on object, and the CSS url() function.
  /<video\b[^>]*\bposter="(https?:\/\/[^"]+)"/gi,
  /<object\b[^>]*\bdata="(https?:\/\/[^"]+)"/gi,
  /url\(\s*['"]?(https?:\/\/[^'")]+)/gi,
]

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    e.isDirectory() ? walk(p, out) : out.push(p)
  }
  return out
}

const files = walk('dist')
const pages = files.filter((f) => f.endsWith('.html'))
const failures = []
const pass = (label, actual, limit, cmp = (a, l) => a <= l) => {
  const ok = cmp(actual, limit)
  console.log(`  ${ok ? 'ok ' : 'FAIL'} ${label.padEnd(46)} ${actual} / ${limit}`)
  if (!ok) failures.push(label)
}

console.log('\nbudgets (BUILD.md section 6)\n')

// 1. index HTML size
const index = readFileSync('dist/index.html')
pass('index.html bytes, uncompressed', index.length, LIMITS.indexHtml)

// 2. one stylesheet, inlined, under 12 KB
const styleBlocks = [...index.toString().matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
const cssBytes = styleBlocks.reduce((n, m) => n + m[1].length, 0)
pass('inlined css bytes', cssBytes, LIMITS.css)
pass('stylesheet <link> elements in the reading path',
  pages.reduce((n, p) => n + (readFileSync(p, 'utf8').match(/<link[^>]+rel="stylesheet"/g) || []).length, 0), 0)

// 3. zero JavaScript in the reading path. application/ld+json is data, not code.
let scriptTags = 0
for (const p of pages) {
  for (const m of readFileSync(p, 'utf8').matchAll(/<script([^>]*)>/g)) {
    if (!/type=["']application\/ld\+json["']/.test(m[1])) scriptTags++
  }
}
pass('executable <script> tags across all pages', scriptTags, LIMITS.scripts)
pass('emitted .js files', files.filter((f) => f.endsWith('.js')).length, 0)

// 4. zero third-party requests
const offOrigin = new Set()
const outbound = new Set()
for (const p of pages) {
  const html = readFileSync(p, 'utf8')
  for (const re of FETCHING) {
    for (const m of html.matchAll(re)) {
      for (const u of m[1].split(/[,\s]+/)) {
        if (/^https?:\/\//.test(u) && !u.startsWith(SITE)) offOrigin.add(u)
      }
    }
  }
  for (const m of html.matchAll(/<a\b[^>]*\bhref="(https?:\/\/[^"]+)"/gi)) {
    if (!m[1].startsWith(SITE)) outbound.add(m[1])
  }
}
pass('third-party requests to render a page', offOrigin.size, LIMITS.offOrigin)
if (offOrigin.size) [...offOrigin].forEach((u) => console.log(`       ${u}`))
console.log(`  --   outbound links (not requests, not gated): ${outbound.size}`)

// 5. zero webfonts. Nothing downloaded means nothing blocked and nothing phoning home.
const fontFaces = pages.reduce((n, p) => n + (readFileSync(p, 'utf8').match(/@font-face/g) || []).length, 0)
pass('@font-face declarations', fontFaces, LIMITS.fontFace)

// 6. every page carries a canonical, which is what makes the alias domains safe
const missingCanonical = pages.filter((p) => !/rel="canonical"/.test(readFileSync(p, 'utf8')))
pass('pages missing rel=canonical', missingCanonical.length, 0)
missingCanonical.forEach((p) => console.log(`       ${p}`))

// 7. largest page, as a warning rather than a limit
const biggest = pages.map((p) => [p, statSync(p).size]).sort((a, b) => b[1] - a[1])[0]
console.log(`  --   largest page: ${biggest[0]} at ${biggest[1]} bytes`)

console.log('')
if (failures.length) {
  console.error(`budget check FAILED: ${failures.join(', ')}\n`)
  process.exit(1)
}
console.log('all budgets within limits\n')

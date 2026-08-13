// Internal link and anchor integrity across the whole build, not just the index.
// T13's anchor preservation lives here: every anchor the prototype published
// must still resolve, because a published URL that stops working is the thing
// section 2.2 forbids.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const walk = (d, o = []) => { for (const e of readdirSync(d, { withFileTypes: true })) {
  const p = join(d, e.name); e.isDirectory() ? walk(p, o) : o.push(p) } return o }
const pages = walk('dist').filter((f) => f.endsWith('.html'))
const exists = (u) => ['dist' + u, 'dist' + u + 'index.html', 'dist' + u + '/index.html']
  .some((p) => { try { return statSync(p).isFile() } catch { return false } })

// Anchors published by the handoff prototype. These are permanent.
const PROTOTYPE_ANCHORS = ['status','abstract','toc','s1','s2','s21','s22','s3','s4','s5','s6',
  's61','s62','s63','s64','s65','s7','s8','s9','s91','s92','s93','s10','s11','s12','s13','s131',
  's132','s14','sa','sb','sig']

let broken = 0
const seenIds = new Set()
for (const p of pages) {
  const html = readFileSync(p, 'utf8')
  for (const m of html.matchAll(/id="([^"]+)"/g)) if (p === 'dist/index.html') seenIds.add(m[1])
  for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
    const [path] = m[1].split('#')
    if (path && !exists(path)) { console.error(`  BROKEN ${m[1]}  (in ${p})`); broken++ }
  }
}
const lostAnchors = PROTOTYPE_ANCHORS.filter((a) => !seenIds.has(a))
console.log(`\nlinks\n  pages scanned          ${pages.length}`)
console.log(`  broken internal links  ${broken}`)
console.log(`  prototype anchors lost ${lostAnchors.length}${lostAnchors.length ? ' -> ' + lostAnchors.join(', ') : ''}`)
console.log('')
if (broken || lostAnchors.length) { console.error('link check FAILED\n'); process.exit(1) }
console.log('every internal link resolves and every published anchor survives\n')

// Internal link and anchor integrity across the whole build, not just the index.
// T13's anchor preservation lives here: every anchor the prototype published
// must still resolve, because a published URL that stops working is the thing
// section 2.2 forbids.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const walk = (d, o = []) => { for (const e of readdirSync(d, { withFileTypes: true })) {
  const p = join(d, e.name); e.isDirectory() ? walk(p, o) : o.push(p) } return o }
const pages = walk('dist').filter((f) => f.endsWith('.html'))
const isFile = (u) => ['dist' + u, 'dist' + u + 'index.html', 'dist' + u + '/index.html']
  .some((p) => { try { return statSync(p).isFile() } catch { return false } })

/*
 * A published URL is not always a file. Short links are served from
 * dist/_redirects by the edge, so a link to one resolves for a reader and does
 * not exist on disk, and treating that as broken would be wrong in the same way
 * that treating it as fine unchecked would be.
 *
 * So both halves are checked here. A link to a redirect source counts as
 * resolving, and every redirect destination has to resolve to a real page. The
 * second half is a gap this file has had for as long as _redirects has existed:
 * nothing has ever read that file, and a rule pointing at a deleted page failed
 * silently at the edge.
 */
const redirects = new Map()
let ruleLines = 0
try {
  for (const m of readFileSync('dist/_redirects', 'utf8').matchAll(/^(\/\S+)\s+(\S+)\s+\d{3}\s*$/gm)) {
    ruleLines++
    // Keyed without the trailing slash, because each short link is emitted in
    // both forms and they are one promise, not two.
    redirects.set(m[1].replace(/\/$/, ''), m[2])
  }
} catch {}
const exists = (u) => isFile(u) || redirects.has(u.replace(/\/$/, ''))

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
// Every rule is a promise the edge keeps. A destination that stopped existing
// turns a 301 into a redirect to a 404, which is worse than never having had one.
let deadRules = 0
for (const [from, to] of redirects) {
  if (/^https?:/.test(to)) continue
  if (!isFile(to)) { console.error(`  DEAD RULE ${from} -> ${to}`); deadRules++ }
}

const lostAnchors = PROTOTYPE_ANCHORS.filter((a) => !seenIds.has(a))
console.log(`\nlinks\n  pages scanned          ${pages.length}`)
console.log(`  redirect rules         ${ruleLines} in ${redirects.size} paths`)
console.log(`  rules with a dead end  ${deadRules}`)
console.log(`  broken internal links  ${broken}`)
console.log(`  prototype anchors lost ${lostAnchors.length}${lostAnchors.length ? ' -> ' + lostAnchors.join(', ') : ''}`)
console.log('')
if (broken || deadRules || lostAnchors.length) { console.error('link check FAILED\n'); process.exit(1) }
console.log('every internal link resolves and every published anchor survives\n')

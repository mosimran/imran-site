// BUILD.md section 3. If a published claim changed and no errata entry was added,
// fail. Changing a published claim silently is the one thing this site exists not
// to do.
//
// Watched implementation notes from 2026-09-03. Until then this only read
// src/content/papers, so note 3.3 could be retitled and have two figures removed
// without the gate noticing. Erratum 7.13 was written by hand; it should not have
// depended on somebody remembering.
//
// Needs a base to diff against. On a PR that is origin/main; locally it is the
// previous commit. With neither it reports and exits 0 rather than pretending.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const sh = (c) => { try { return execSync(c, { stdio: ['ignore','pipe','ignore'] }).toString() } catch { return null } }
const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1'
if (!sh(`git rev-parse ${base}`)) {
  console.log(`\nerrata\n  no base commit (${base}) to diff against, skipping\n`); process.exit(0)
}

const field = (txt, name) => (txt.match(new RegExp(`^${name}:\\s*(.+)$`, 'm')) || [])[1]?.trim()

// Fields a reader could quote back at you. Multi-line blocks (metrics, failures,
// retires) are not diffed here; single-line scalars and inline arrays are.
const WATCHED = {
  'src/content/papers': ['confidence', 'state'],
  'src/content/impl': ['title', 'state', 'summary', 'result', 'stack', 'fallsOverAt'],
}

const changed = []
for (const [dir, keys] of Object.entries(WATCHED)) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const path = `${dir}/${f}`
    const before = sh(`git show ${base}:${path}`)
    if (!before) continue                     // newly added, nothing published to contradict
    const after = readFileSync(path, 'utf8')
    for (const k of keys) {
      const a = field(before, k), b = field(after, k)
      if (a !== b) changed.push(`${f}: ${k}\n      was  ${a ?? '(absent)'}\n      now  ${b ?? '(absent)'}`)
    }
  }
}

const errataBefore = sh(`git ls-tree --name-only ${base} src/content/errata/`) || ''
const errataNow = readdirSync('src/content/errata').join('\n')
const added = errataNow.split('\n').filter((x) => x && !errataBefore.includes(x))

console.log(`\nerrata\n  claims changed  ${changed.length}`)
changed.forEach((c) => console.log(`    ${c}`))
console.log(`  errata added    ${added.length}`)
if (changed.length && !added.length) {
  console.error('\nerrata check FAILED: a published claim changed with no errata entry.')
  console.error('Add a file under src/content/errata/ saying what changed and why.\n')
  process.exit(1)
}
console.log('')

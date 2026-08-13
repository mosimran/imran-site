// BUILD.md section 3. If a published paper's confidence or state changed and no
// errata entry was added, fail. Changing a published claim silently is the one
// thing this site exists not to do.
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
const changed = []
for (const f of readdirSync('src/content/papers').filter((x) => x.endsWith('.md'))) {
  const path = `src/content/papers/${f}`
  const before = sh(`git show ${base}:${path}`)
  if (!before) continue                       // new paper, nothing published to contradict
  const after = readFileSync(path, 'utf8')
  for (const k of ['confidence', 'state']) {
    const a = field(before, k), b = field(after, k)
    if (a !== b) changed.push(`${f}: ${k} ${a} -> ${b}`)
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

// Every implementation note carries a `revised` date, and it has to be the date
// the file actually last changed.
//
// Until 2026-09-04 the feed used `since` for these entries, which is when the
// system started running rather than when the document changed. Nine notes
// written in September went out to subscribers dated January, and 3.1 dated
// 2022, so the whole of Section 3 arrived at the bottom of a reader or not at
// all. `revised` fixes that and introduces a new way to be wrong: a note edited
// without bumping it. Git knows the truth, so this asks git. Erratum 7.35.
//
// Skips rather than guesses when history is unavailable, which is what a shallow
// clone gives. A check that cannot see the answer should say so, not invent one.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const DIR = 'src/content/impl'
const sh = (c) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '' } }

if (!sh('git rev-parse --is-inside-work-tree')) {
  console.log('\nrevised dates\n  not a git checkout, skipping\n'); process.exit(0)
}
// A shallow clone reports the same date for every path. Detect it and skip.
const depth = sh('git rev-list --count HEAD')
if (!depth || Number(depth) < 2) {
  console.log(`\nrevised dates\n  shallow history (${depth || '0'} commits), skipping\n`); process.exit(0)
}

const stale = []
let checked = 0
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const path = `${DIR}/${f}`
  const declared = (readFileSync(path, 'utf8').match(/^revised:\s*(\S+)/m) || [])[1]
  const actual = sh(`git log -1 --format=%ad --date=short -- "${path}"`)
  if (!declared || !actual) continue
  checked++
  // Uncommitted edits show the previous commit's date, so only a declared date
  // OLDER than git's is a problem. Newer means the change is not committed yet.
  if (declared < actual) stale.push(`${f}: says ${declared}, last changed ${actual}`)
}

console.log(`\nrevised dates\n  notes checked  ${checked}\n  stale          ${stale.length}`)
for (const s of stale) console.log(`    ${s}`)
if (stale.length) {
  console.error('\nrevised check FAILED: a note changed and its revised date did not.')
  console.error('The feed sorts on this, so a stale date hides the change from subscribers.\n')
  process.exit(1)
}
console.log('')

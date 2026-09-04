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
// A REPORTER, never a gate, and the reason is worth stating because the first
// version of this file was a gate and failed on the commit that created it.
//
// `revised` means the date the content last meaningfully changed. Git records
// the date the file last changed for any reason, including adding this very
// field, fixing a typo or reflowing a paragraph. Those are different questions
// and only a person can answer the first. Gating on git asserts that every edit
// is a revision, which is false, and it made eight notes "stale" the moment
// their dates were introduced.
//
// So it prints divergence for someone to judge and exits 0. Erratum 7.35.
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

console.log(`\nrevised dates\n  notes checked          ${checked}`)
console.log(`  file newer than date  ${stale.length}`)
for (const s of stale) console.log(`    ${s}`)
if (stale.length) {
  console.log('\n  Each of these changed after the date it declares. That is correct when the')
  console.log('  edit was a typo or a field like this one, and wrong when the meaning moved.')
  console.log('  The feed sorts on the declared date, so a real revision left unbumped is')
  console.log('  invisible to subscribers. Reporter, not a gate: only a person can tell')
  console.log('  which of those happened.')
}
console.log('')

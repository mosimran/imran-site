/*
 * Short links. One permanent code per numbered document, issued once and never
 * changed.
 *
 * The code is the document's own section number with the dot replaced by a
 * hyphen, so 5.14 becomes /l/5-14. That is not a new convention: the errata page
 * has built its anchors with the same substitution since it was written, and the
 * errata source files are named 7-25.md for the same reason. A dot in a path
 * reads as a file extension and gets swallowed by autolinkers at the end of a
 * sentence.
 *
 * Two modes, and they are deliberately separate:
 *
 *   node scripts/shortlinks.mjs          issue codes for anything unissued
 *   node scripts/shortlinks.mjs --emit   write the rules into dist/_redirects
 *
 * Issuing mutates a checked-in file, so it is a hand-run act rather than a build
 * side effect. A short link is a promise printed on paper and cached by browsers
 * for as long as they feel like it. Handing one out should take a deliberate
 * keystroke, the same way make-social.mjs is hand-run and check-social.mjs keeps
 * it honest afterwards.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const LEDGER = 'src/data/shortlinks.json'

// Both collections are real pages at real URLs with a section number each.
// Errata are anchors on one shared page, not pages, so they are out until a
// redirect to a fragment is verified rather than assumed.
const SOURCES = [
  ['src/content/papers', '/papers/'],
  ['src/content/impl', '/impl/'],
]

const today = () => new Date().toISOString().slice(0, 10)
export const codeFor = (section) => section.replace(/\./g, '-')

/** Every numbered document, read from front matter rather than from a list. */
export function documents() {
  const out = []
  for (const [dir, prefix] of SOURCES) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
      const body = readFileSync(`${dir}/${f}`, 'utf8')
      const m = body.match(/^section:\s*["']?([0-9.]+)["']?\s*$/m)
      if (!m) continue
      out.push({ section: m[1], target: `${prefix}${f.replace(/\.md$/, '')}/` })
    }
  }
  return out.sort(byNumber)
}

const byNumber = (a, b) => {
  const [am, an] = a.section.split('.').map(Number)
  const [bm, bn] = b.section.split('.').map(Number)
  return am - bm || an - bn
}

export const readLedger = () =>
  existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : {}

function issue() {
  const ledger = readLedger()
  const issued = []
  const conflicts = []

  for (const doc of documents()) {
    const code = codeFor(doc.section)
    const have = ledger[code]
    if (!have) {
      ledger[code] = { section: doc.section, target: doc.target, since: today() }
      issued.push(`${code} -> ${doc.target}`)
      continue
    }
    // An issued code is not a mapping this script gets to revise. Renumbering a
    // section or moving a slug is a decision with a published consequence, and
    // it is made by a person editing the ledger and writing down why.
    if (have.target !== doc.target) conflicts.push(`${code} points at ${have.target}, ${doc.section} is now ${doc.target}`)
  }

  const sorted = Object.fromEntries(
    Object.entries(ledger).sort(([, a], [, b]) => byNumber(a, b)),
  )
  writeFileSync(LEDGER, JSON.stringify(sorted, null, 2) + '\n')

  console.log(`\nshort links\n  codes on record        ${Object.keys(sorted).length}`)
  console.log(`  newly issued           ${issued.length}`)
  issued.forEach((l) => console.log(`       ${l}`))
  if (conflicts.length) {
    console.error(`\n  a published code cannot be repointed by a script:`)
    conflicts.forEach((l) => console.error(`       ${l}`))
    console.error('')
    process.exit(1)
  }
  console.log('')
}

/*
 * Rules go into dist/_redirects after the build, the same shape as
 * csp-hashes.mjs appending per-path policies to dist/_headers.
 *
 * Two lines per code because Pages matches the path exactly and this site's own
 * trailingSlash habit means a hand-typed /l/5-14/ is likely. The documented
 * ceiling is 2,000 static rules; this uses seventy of them.
 *
 * The target is a path and not an absolute URL, so the requesting host is kept.
 * imran.com.bd/l/5-14 lands on imran.com.bd, which serves the same bytes with a
 * canonical naming the primary. That is the aliasing mechanism PLAN section 2.1
 * already relies on rather than a second one.
 */
function emit() {
  const file = 'dist/_redirects'
  if (!existsSync(file)) {
    console.error('\nshort links\n  no dist/_redirects, run the build first\n')
    process.exit(1)
  }
  const ledger = readLedger()
  const lines = []
  for (const [code, e] of Object.entries(ledger)) {
    lines.push(`/l/${code}    ${e.target}   301`)
    lines.push(`/l/${code}/   ${e.target}   301`)
  }
  /*
   * Truncate at the marker before writing, so emitting twice produces the same
   * file rather than twice the rules. `astro build` clears dist and hides this,
   * but the header above documents --emit as a command a person can run, and it
   * doubled the file every time it was run on its own. Duplicate rules are
   * harmless at the edge, where the first match wins, which is exactly why
   * nothing would have noticed. check-short.mjs now counts them too.
   */
  const MARK = '# Generated by scripts/shortlinks.mjs'
  let existing = readFileSync(file, 'utf8')
  const at = existing.indexOf(MARK)
  if (at !== -1) existing = existing.slice(0, at).replace(/\n+$/, '\n')

  writeFileSync(file,
    existing +
    '\n# Generated by scripts/shortlinks.mjs from src/data/shortlinks.json.\n' +
    '# One permanent code per numbered document. The map is published at /l/.\n' +
    '# 301 and not 302: the mapping is permanent by design and check-short.mjs\n' +
    '# fails the build if one is ever repointed.\n\n' +
    lines.join('\n') + '\n')

  const total = (existing.match(/^\/\S+\s+\S+\s+30[0-9]/gm) || []).length + lines.length
  console.log(`\nshort links\n  codes emitted          ${Object.keys(ledger).length}`)
  console.log(`  redirect rules written ${lines.length}`)
  console.log(`  rules in file total    ${total} / 2000\n`)
}

// Only when run directly. check-short.mjs imports the derivation and the ledger
// reader from here, and an import that also issues codes would mean a check with
// a side effect on a checked-in file.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--emit')) emit()
  else issue()
}

// The author's role is allowed to be written down in exactly one place.
//
// This document published a title its author did not hold for a year, in eight
// places at once, which is erratum 7.9. That erratum was closed by correcting
// all eight strings. Correcting eight copies is not the same as having one, and
// on 2026-09-10 the next role change found five of them still holding their own
// copy: the masthead, the meta description, both image alt texts, llms.txt and
// the text baked into the share card.
//
// So this is the check that erratum should have come with. The role string may
// appear in src/lib/contact.ts, where it is defined, and in src/content/errata,
// where the record of every past value lives and must not be rewritten. A copy
// anywhere else fails the build.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SOURCE = 'src/lib/contact.ts'

// Read the current value out of the source rather than typing it here, because
// a check that hardcodes the string it is banning is one more copy of it.
const src = readFileSync(SOURCE, 'utf8')
const role = (src.match(/^\s*role:\s*'([^']+)'/m) || [])[1]
const org = (src.match(/^\s*org:\s*'([^']+)'/m) || [])[1]
if (!role || !org) {
  console.error(`\nrole check: could not read role and org out of ${SOURCE}\n`)
  process.exit(1)
}

/*
 * Past values too. A role that changes leaves its old string behind in whatever
 * surface nobody remembered, which is precisely how 7.9 happened: the résumé had
 * said the right thing for a year while the site said the wrong one. Every value
 * this document has published is named in the errata, so the errata are where
 * the list of what to hunt for comes from.
 */
const RETIRED = ['Lead Solutions Architect', 'Head of Engineering and Delivery']

// Where a role string is the record rather than a copy of a fact.
const ALLOWED = [
  SOURCE,
  'src/content/errata',   // the published history of what was wrong
  // Appendix A, for the same reason as the errata. A revision row saying the
  // title changed has to name both titles, and the owner's instruction on
  // 2026-09-10 was explicitly to keep the previous one on the record rather
  // than overwrite it. These are prose about a change, not a value anything
  // renders.
  'src/lib/history.ts',
  'docs',                 // the worklog, the placeholder ledger, the plans
  // This file. It holds RETIRED above, which is the list of strings to hunt for
  // rather than a value anything renders. The first run of this check failed on
  // its own ban list, which is the correct behaviour and the wrong exemption.
  'scripts/check-role.mjs',
]

const SCAN_EXT = new Set(['.astro', '.ts', '.tsx', '.mjs', '.js', '.json', '.md', '.css', '.html'])

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue
    if (e.isDirectory()) walk(p, out)
    else if (SCAN_EXT.has(p.slice(p.lastIndexOf('.')))) out.push(p)
  }
  return out
}

const files = [...walk('src'), ...walk('scripts'), ...walk('functions'), ...walk('public')]
  .filter((f) => !ALLOWED.some((a) => f === a || f.startsWith(a + '/')))

const hits = []
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  for (const needle of [role === 'CTO' ? null : role, `${role}, ${org}`, org, ...RETIRED].filter(Boolean)) {
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      if (line.includes(needle)) hits.push({ f, line: i + 1, needle, text: line.trim().slice(0, 80) })
    })
  }
}

console.log('\nthe role is written down once\n')
console.log(`  source                 ${SOURCE}`)
console.log(`  current                ${role}, ${org}`)
console.log(`  retired values watched ${RETIRED.length}`)
console.log(`  files scanned          ${files.length}`)

/*
 * The bare title is exempt from the scan when it is an abbreviation. "CTO" is
 * three letters that occur inside ordinary words and inside unrelated prose, so
 * matching it produces noise rather than findings. The organisation name and the
 * combined line are specific enough to match on, and between them they catch the
 * copy that actually causes drift, which is a rendered role line.
 */
if (role.length <= 4) {
  console.log(`  note                   "${role}" is too short to scan for; org and the full line are matched instead`)
}

if (hits.length) {
  console.log('')
  for (const h of hits) console.log(`  FAIL ${h.f}:${h.line}  "${h.needle}"\n         ${h.text}`)
  console.error(`\nrole check FAILED: ${hits.length} copy of the role outside ${SOURCE}\n`)
  console.error('Import { contact, roleLine, roleAt } from lib/contact instead of typing it.')
  console.error('If this is a record of a past value rather than a copy of the current one,')
  console.error('it belongs in src/content/errata or docs.\n')
  process.exit(1)
}
console.log('\n  no copy of the role outside its source\n')

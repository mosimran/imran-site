// Prose tells, reported per file. Written 2026-09-03 after the owner flagged the
// same pattern twice: sentences built as a negation followed by its flip ("X is
// not Y. It is Z."), which reads as machine-generated.
//
// A reporter, never a gate. The negation-flip test has real false positives: a
// referential "This is..." after a sentence that merely contains a negation is
// ordinary prose. It prints the pair so a person can judge, which is the point.
import { readdirSync, readFileSync, existsSync } from 'node:fs'

const DIRS = ['src/content/impl', 'src/content/papers', 'src/content/errata']
const HYPE = /\b(seamless|robust|elevate|unlock|empower|delve|tapestry|testament|cutting-edge|game-chang\w*|realm)\b|\b(?:leverages|leveraging|leveraged)\b|\b(?:to|can|will|should|must)\s+leverage\b/gi

let files = 0, em = 0, notjust = 0
const hypeHits = []
const flips = []
const byDir = {}

for (const dir of DIRS) {
  if (!existsSync(dir)) continue
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    files++
    const raw = readFileSync(`${dir}/${f}`, 'utf8')
    const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    em += (plain.match(/—/g) || []).length
    notjust += (plain.match(/not just .{0,40}? but /gi) || []).length
    for (const h of plain.match(HYPE) || []) hypeHits.push(`${dir}/${f}: ${h}`)
    const sents = plain.split(/(?<=[.!?]) /).map((s) => s.trim()).filter(Boolean)
    for (let i = 0; i < sents.length - 1; i++) {
      const a = sents[i], b = sents[i + 1]
      if (/\b(is not|are not|was not|does not|do not)\b/i.test(a) && /^(It is|That is|It exists|They are|This is)\b/.test(b)) {
        byDir[dir] = (byDir[dir] ?? 0) + 1
        flips.push({ dir, where: `${dir}/${f}`, a: a.slice(-90), b: b.slice(0, 90) })
      }
    }
  }
}

console.log(`\nprose tells across ${files} content files\n`)
console.log(`  em dashes                    ${em}`)
console.log(`  "not just X but Y"           ${notjust}`)
console.log(`  hype adjectives              ${hypeHits.length}`)
for (const h of hypeHits) console.log(`    ${h}`)
console.log(`  negation followed by a flip  ${flips.length}`)
for (const [d, n] of Object.entries(byDir)) console.log(`    ${d.padEnd(22)} ${n}`)
const shown = flips.filter((f) => f.dir === 'src/content/impl')
console.log(`\n  pairs in src/content/impl, the notes worked on most recently:`)
for (const f of shown) console.log(`    ${f.where}\n      ${f.a}\n      ${f.b}`)
console.log('\n  Reporter, not a gate. The last one has false positives: a referential')
console.log('  "This is..." is ordinary prose. Read the pair before rewriting it.\n')

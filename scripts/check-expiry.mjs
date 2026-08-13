// Documents borrow the Internet-Draft rule of expiring 185 days after their last
// revision. Warns at 30 days out. Never fails: an expired paper is a fact about
// the paper, not a broken build.
import { readdirSync, readFileSync } from 'node:fs'
const DAYS = 185, WARN = 30
const today = new Date()
const rows = []
for (const f of readdirSync('src/content/papers').filter((x) => x.endsWith('.md'))) {
  const s = readFileSync(`src/content/papers/${f}`, 'utf8')
  const m = s.match(/^revised:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/m)
  if (!m) continue
  const exp = new Date(m[1]); exp.setUTCDate(exp.getUTCDate() + DAYS)
  const left = Math.round((exp - today) / 86400000)
  rows.push({ slug: f.replace(/\.md$/, ''), exp: exp.toISOString().slice(0, 10), left })
}
rows.sort((a, b) => a.left - b.left)
const expired = rows.filter((r) => r.left < 0)
const soon = rows.filter((r) => r.left >= 0 && r.left <= WARN)
console.log(`\nexpiry (185 days from last revision)\n  ${rows.length} documents`)
console.log(`  expired          ${expired.length}`)
expired.forEach((r) => console.log(`    ${r.slug.padEnd(32)} expired ${r.exp} (${-r.left}d ago)`))
console.log(`  within ${WARN} days   ${soon.length}`)
soon.forEach((r) => console.log(`    ${r.slug.padEnd(32)} expires ${r.exp} (${r.left}d)`))
console.log('')

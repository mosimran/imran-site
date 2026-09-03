// Reports the placeholder ledger. Never fails a build: shipping the prototype
// content as-is is a decision on record, and this is the register of that debt.
import { readFileSync } from 'node:fs'
const md = readFileSync('docs/PLACEHOLDERS.md', 'utf8')
const rows = [...md.matchAll(/^- \[( |x)\] \*\*(P\d+)\*\* (.+)$/gm)]
if (!rows.length) { console.error('placeholders: ledger could not be parsed'); process.exit(1) }
const open = rows.filter((r) => r[1] === ' ')
console.log(`\nplaceholders\n  ${open.length} open of ${rows.length}`)
for (const r of open) console.log(`  ${r[2]}  ${r[3].slice(0, 76)}`)

// A row whose own text says it was closed, with the box still unticked. P10 read
// as open for three weeks that way: its body said "Closed by T09" the whole time.
// Cheap to detect and invisible to read past, which is the combination worth a check.
const blocks = md.split(/^(?=- \[[ x]\] \*\*P\d+\*\*)/m)
const contradictions = []
for (const b of blocks) {
  const head = b.match(/^- \[( |x)\] \*\*(P\d+)\*\* (.+)$/m)
  if (!head || head[1] === 'x') continue
  if (/\bClosed\b/.test(b.slice(head[0].length))) contradictions.push(`${head[2]}  ${head[3].slice(0, 62)}`)
}
if (contradictions.length) {
  console.log(`\n  rows whose text says closed while the box is open: ${contradictions.length}`)
  for (const c of contradictions) console.log(`    ${c}`)
  console.log('  Tick the box, or say why the row is still open.')
}
console.log('')

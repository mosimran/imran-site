// Reports the placeholder ledger. Never fails a build: shipping the prototype
// content as-is is a decision on record, and this is the register of that debt.
import { readFileSync } from 'node:fs'
const md = readFileSync('docs/PLACEHOLDERS.md', 'utf8')
const rows = [...md.matchAll(/^- \[( |x)\] \*\*(P\d+)\*\* (.+)$/gm)]
if (!rows.length) { console.error('placeholders: ledger could not be parsed'); process.exit(1) }
const open = rows.filter((r) => r[1] === ' ')
console.log(`\nplaceholders\n  ${open.length} open of ${rows.length}`)
for (const r of open) console.log(`  ${r[2]}  ${r[3].slice(0, 76)}`)
console.log('')

// The document has one identifier, and every page has to publish the same one.
//
// It did not. The front page computed the suffix from Appendix A and reached
// draft-imran-systems-and-arguments-41, while the shared layout carried a
// literal 5 under a comment reading "keep in step with index.astro" and put -04
// on every other page. Both were live at the same time for weeks. A document
// whose own name disagrees across its own pages has no name. Erratum 7.48.
//
// The number is the count of Appendix A rows minus one, so it changes whenever
// anything on this site is corrected. That is the point of it, and it is also
// why nothing may hold a second copy: the value is designed to move.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const RE = /draft-imran-systems-and-arguments-\d{2,}/g

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    // The feeds, llms.txt and the machine-readable views name it too, and a
    // reader that consumes those is exactly the reader who will notice.
    else if (/\.(html|xml|txt|json|md|vcf)$/.test(p)) out.push(p)
  }
  return out
}

const seen = new Map()   // identifier -> files
for (const f of walk('dist')) {
  const text = readFileSync(f, 'utf8')
  for (const m of text.match(RE) ?? []) {
    if (!seen.has(m)) seen.set(m, [])
    if (!seen.get(m).includes(f)) seen.get(m).push(f)
  }
}

console.log('\nthe document has one identifier\n')

if (seen.size === 0) {
  console.error('  FAIL no draft identifier found anywhere in dist\n')
  process.exit(1)
}

for (const [ident, files] of [...seen].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(files.length).padStart(4)} files  ${ident}`)
  if (seen.size > 1) for (const f of files.slice(0, 4)) console.log(`             ${f}`)
}

if (seen.size > 1) {
  console.error(`\nident check FAILED: ${seen.size} different identifiers are published at once\n`)
  console.error('Every surface must compute it from history.length, never hold a literal.')
  console.error('See src/lib/draft.ts and src/lib/history.ts.\n')
  process.exit(1)
}

console.log(`\n  one identifier across ${[...seen.values()][0].length} files\n`)

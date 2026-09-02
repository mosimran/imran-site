// Scores each Section 3 note against the seven-item bar in
// docs/SECTION-3-PLAN.md, and reports rather than fails.
//
// The bar was written into that plan as prose on 2026-09-02, which made it a
// policy rather than a control. Note 3.1 spends a section arguing that the
// difference between the two is enforcement, so leaving the bar in a markdown
// file was the exact failure that note is about. This is the instrument.
//
// It never fails a build. Most notes are legitimately unwritten and a gate that
// is always red teaches you to stop reading it, which is erratum 7.6's lesson.
// This is a progress meter, like `npm run placeholders`.
//
// Item 6 is the weakest heuristic here. Product reasoning is a judgement a
// person makes; the script can only see whether the note talks about who the
// system serves at all.
import { readdirSync, readFileSync } from 'node:fs'

const DIR = 'src/content/impl'

const ITEMS = [
  ['constraint', (fm, b) => /##[^\n]*constraint|##[^\n]*the claim/i.test(b)],
  ['enforcement', (fm, b) => /fails the build|fails CI|hook rejects|enforced at |enforced by/i.test(b)],
  ['diagram', (fm, b) => /<svg|<figure/.test(b)],
  // Every metric note must label its figure as a measurement or a target. The
  // first version of this looked for the exact phrases note 3.1 happened to use,
  // which failed any note carrying only measurements and nothing to contrast
  // them against. The convention is the label, not the contrast.
  ['numbers labelled', (fm) => {
    // Scoped to the metrics block. Matching note: across the whole front matter
    // also swept up the failures: prose, which never carries these words, so
    // every note failed regardless of how its figures were labelled.
    const block = (fm.match(/^metrics:\n([\s\S]*?)(?=^\w|\Z)/m) || [])[1] || ''
    const notes = [...block.matchAll(/note:\s*"([^"]*)"/g)].map((m) => m[1])
    return notes.length > 0 && notes.every((n) => /\b(measured|measurement|target)\b/i.test(n))
  }],
  ['failure modes', (fm) => /^failures:/m.test(fm)],
  // Who the system serves and what the design costs them. The vocabulary was
  // first taken from note 3.1, a multi-tenant SaaS, and undercounted shared
  // infrastructure that legitimately talks about consuming platforms and end
  // users instead of tenants.
  ['product reasoning', (fm, b) =>
    (b.match(/tenant|customer|bank|operator|buyer|regulated|client|end user|the product|support burden|integration/gi) || []).length >= 5],
  ['what I would do differently', (fm, b) => /what I would do differently/i.test(b)],
]

const notes = []
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const raw = readFileSync(`${DIR}/${f}`, 'utf8')
  const parts = raw.split(/^---$/m)
  const fm = parts[1] ?? ''
  const body = parts.slice(2).join('---')
  const section = (fm.match(/^section:\s*"([^"]+)"/m) || [])[1] ?? '?'
  const state = (fm.match(/^state:\s*(\w+)/m) || [])[1] ?? '?'
  const words = body.trim().split(/\s+/).filter(Boolean).length
  const passed = ITEMS.filter(([, fn]) => fn(fm, body)).map(([n]) => n)
  notes.push({ section, file: f.replace(/\.md$/, ''), state, words, passed })
}
notes.sort((a, b) => Number(a.section.split('.')[1]) - Number(b.section.split('.')[1]))

console.log('\nsection 3 notes, against the seven-item bar\n')
console.log('  §     note                    state       words   score  missing')
for (const n of notes) {
  const missing = ITEMS.map(([x]) => x).filter((x) => !n.passed.includes(x))
  const score = `${n.passed.length}/7`
  console.log(
    `  ${n.section.padEnd(5)} ${n.file.padEnd(23)} ${n.state.padEnd(11)} ${String(n.words).padStart(5)}   ${score.padEnd(6)} ${missing.join(', ') || '-'}`,
  )
}

const done = notes.filter((n) => n.passed.length === 7).length
const total = notes.length
const points = notes.reduce((s, n) => s + n.passed.length, 0)
console.log(`\n  ${done} of ${total} notes clear the bar. ${points} of ${total * 7} items across the section.`)
console.log('  Reporter, not a gate. Item 6 is a keyword count and no substitute for reading.\n')

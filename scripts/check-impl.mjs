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
import { readdirSync, readFileSync, existsSync } from 'node:fs'

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
    // No metrics is a different problem from unlabelled metrics, and the owner
    // needs to know which. Neither passes: the bar asks for numbers.
    if (notes.length === 0) return { pass: false, why: 'no figures supplied' }
    return notes.every((n) => /\b(measured|measurement|target)\b/i.test(n))
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
  // An item may return a bare boolean, or { pass, why } when the reason it failed
  // is worth printing. 3.6 fails 'numbers labelled' because it carries no figures
  // at all and says so, which is a different job from labelling the ones it has.
  const why = {}
  const passed = ITEMS.filter(([name, fn]) => {
    const r = fn(fm, body)
    if (r && typeof r === 'object') { if (r.why) why[name] = r.why; return r.pass }
    return r
  }).map(([n]) => n)
  notes.push({ section, file: f.replace(/\.md$/, ''), state, words, passed, why })
}
notes.sort((a, b) => Number(a.section.split('.')[1]) - Number(b.section.split('.')[1]))

console.log('\nsection 3 notes, against the seven-item bar\n')
console.log('  §     note                    state       words   score  missing')
for (const n of notes) {
  const missing = ITEMS.map(([x]) => x).filter((x) => !n.passed.includes(x))
    .map((x) => (n.why[x] ? `${x} (${n.why[x]})` : x))
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

// Provenance. The prototype's figures were catalogued in the placeholder ledger
// and its failure modes were not, so note 3.2 published three invented failure
// narratives as this person's engineering record for a year and nothing was
// watching. This reads the handoff prototype and reports any front-matter note
// whose opening words appear in it verbatim.
const PROTOTYPE = 'docs/intitial-handoff/mosthofaimran.com/index.html'
if (existsSync(PROTOTYPE)) {
  const proto = readFileSync(PROTOTYPE, 'utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase()
  const carried = []
  for (const f of readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
    const fm = readFileSync(`${DIR}/${f}`, 'utf8').split('---')[1] ?? ''
    // summary and fallsOverAt are published claims too. Checking only note: missed
    // 3.4, whose entire summary ("Fourteen billion rows moved under a dual-write
    // cutover... one rollback executed cleanly at 02:40") is the prototype's.
    const fields = [
      ...[...fm.matchAll(/note:\s*"([^"]{60,})"/g)].map((m) => ['failure', m[1]]),
      ...[...fm.matchAll(/^(summary|fallsOverAt):\s*"([^"]{60,})"/gm)].map((m) => [m[1], m[2]]),
    ]
    for (const [kind, text] of fields) {
      const frag = text.split(/\s+/).slice(0, 9).join(' ').toLowerCase().replace(/[.,]$/, '')
      if (frag && proto.includes(frag)) carried.push(`${f.replace(/\.md$/, '')} (${kind}): ${frag}...`)
    }
  }
  console.log(`\n  prototype text still carried in front matter: ${carried.length}`)
  for (const c of carried) console.log(`    ${c}`)
  if (carried.length) console.log('    Marked on the page, or replaced. Never deleted quietly.')
}

// Diagram classes. The figures are inline SVG styled by the stylesheet, so a class
// that does not exist fails silently: the shape still renders, in the wrong colour,
// and nothing complains. Written after making the same slip twice in one day, on
// notes 3.3 and 3.4, both times inventing a `bs` class for a dashed warning box.
const CSS = 'src/styles/rfc.css'
if (existsSync(CSS)) {
  const css = readFileSync(CSS, 'utf8')
  const defined = (c) =>
    css.includes(`.dia .${c}{`) || css.includes(`.${c}{`) || css.includes(`,.${c}{`) || css.includes(`.${c} `)
  const bad = []
  for (const dir of ['src/content/impl', 'src/content/papers']) {
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
      const txt = readFileSync(`${dir}/${f}`, 'utf8')
      const used = new Set()
      for (const m of txt.matchAll(/class="([a-z0-9 -]+)"/g)) m[1].split(/\s+/).forEach((c) => c && used.add(c))
      for (const c of used) if (!defined(c)) bad.push(`${dir}/${f}: .${c}`)
    }
  }
  // A blank line ends a raw HTML block in markdown. One inside an <svg> means
  // everything after it is parsed as prose, so the drawing collapses to a box
  // and its labels render as body text under the figure. Every diagram on this
  // site was broken this way and no check saw it: the page still had an <svg>,
  // still passed a11y, still had no overflow and still printed. Erratum 7.39.
  const split = []
  for (const dir of ['src/content/impl', 'src/content/papers']) {
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
      const txt = readFileSync(`${dir}/${f}`, 'utf8')
      for (const m of txt.matchAll(/<svg\b[\s\S]*?<\/svg>/g)) {
        const n = (m[0].match(/\n[ \t]*\n/g) || []).length
        if (n) split.push(`${dir}/${f}: ${n} blank line${n > 1 ? 's' : ''} inside <svg>`)
      }
    }
  }
  console.log(`  diagrams broken by a blank line: ${split.length}`)
  for (const x of split) console.log(`    ${x}`)
  console.log(`\n  undefined SVG/prose classes: ${bad.length}`)
  for (const b of bad) console.log(`    ${b}`)
}

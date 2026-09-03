// Appendix B claims this document "prints as a passable specification". Nothing
// checked it, and it was false: every width-based media query used a bare
// max-width, and a printed page is about 673px of content inside A4 margins,
// which is under every breakpoint the stylesheet declares. Tables printed as
// stacked phone cards, and the sticky heading drew a full-bleed rule across the
// paper. Erratum 7.32.
//
// The assertions are about layout mode rather than appearance: a table that
// prints with its header row is a table, and one whose header is positioned off
// the page is a phone layout that escaped onto paper.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const BASE = (process.argv[2] || process.env.BASE || 'http://127.0.0.1:8822').replace(/\/$/, '')
const PATHS = ['/', '/papers/', '/impl/mevrik-cx/', '/errata/']

// A4 at 96dpi is 794px, and Chrome lays a printed page out inside the page
// margins, so the width CSS sees is roughly 673px. Emulating print media at a
// desktop viewport does not reproduce this: the width query never matches and
// every assertion passes on a page that would print wrong. The first version of
// this file did exactly that and reported clean while the PDF was broken.
const PRINT_WIDTH = 673

const failures = []
const pass = (label, ok, detail) => {
  console.log(`  ${ok ? 'ok ' : 'FAIL'} ${label.padEnd(44)} ${detail}`)
  if (!ok) failures.push(label)
}

// The load-bearing assertion, and it is static rather than rendered. Every
// width-based query in this stylesheet is about a screen; a bare max-width
// applies to paper as well, because paper is narrower than all of them.
const css = readFileSync('src/styles/rfc.css', 'utf8')
const bare = [...css.matchAll(/@media\s*\((?:max|min)-width[^)]*\)/g)].map((m) => m[0])
console.log(`\nprint fidelity\n  base ${BASE}\n`)
console.log('  stylesheet')
pass('every width query is scoped to screen', bare.length === 0,
  bare.length ? bare.join(', ') : 'no bare width queries')
console.log('')

const browser = await chromium.launch()

for (const path of PATHS) {
  const page = await browser.newPage({ viewport: { width: PRINT_WIDTH, height: 1000 } })
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' })
  await page.emulateMedia({ media: 'print' })

  const r = await page.evaluate(() => {
    const t = document.querySelector('table.rt')
    const h2 = document.querySelector('h2')
    const cs = (el) => (el ? getComputedStyle(el) : null)
    const th = t ? cs(t.querySelector('thead')) : null
    const firstCell = t ? cs(t.querySelector('tbody td')) : null
    return {
      hasTable: Boolean(t),
      theadPosition: th ? th.position : 'n/a',
      cellDisplay: firstCell ? firstCell.display : 'n/a',
      h2Position: h2 ? cs(h2).position : 'n/a',
      h2MarginLeft: h2 ? cs(h2).marginLeft : 'n/a',
      headerHidden: cs(document.querySelector('.rh'))?.display === 'none',
    }
  })

  console.log(`  ${path}`)
  if (r.hasTable) {
    pass('tables print as tables', r.theadPosition === 'static', `thead position ${r.theadPosition}`)
    pass('cells print as table cells', r.cellDisplay === 'table-cell', `td display ${r.cellDisplay}`)
  }
  pass('headings are not sticky on paper', r.h2Position === 'static', `h2 position ${r.h2Position}`)
  pass('headings do not bleed past the text', r.h2MarginLeft === '0px', `h2 margin-left ${r.h2MarginLeft}`)
  pass('site chrome is hidden', r.headerHidden, r.headerHidden ? 'header hidden' : 'header printed')
  console.log('')
  await page.close()
}

await browser.close()
if (failures.length) {
  console.error(`print check FAILED: ${[...new Set(failures)].join(', ')}\n`)
  console.error('A width-based media query without `screen and` applies to paper too, because')
  console.error('an A4 page is narrower than every breakpoint in this stylesheet.\n')
  process.exit(1)
}
console.log('the document prints as a document\n')

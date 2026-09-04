// Nothing on this site may be invisible to something that does not scroll.
//
// The home page gained a scroll-driven reveal on 2026-09-04. The first version
// faded headings in from opacity 0, and a crawler-shaped visit left twelve of
// twenty headings fully transparent, including every section from 6 to 14:
// animation-fill-mode: both holds the starting frame until the element enters
// the view range, so anything never scrolled to stays in it.
//
// The rule that came out of that: an entry animation may move content and may
// not hide it. This asserts it, because the failure is silent in a browser
// where you scroll and total in a client that does not. Erratum 7.33.
import { chromium } from 'playwright'

const BASE = (process.argv[2] || process.env.BASE || 'http://127.0.0.1:8831').replace(/\/$/, '')
const PATHS = ['/', '/papers/', '/impl/', '/errata/', '/cv/', '/machine/', '/colophon/', '/history/',
  '/tools/', '/tools/in/devops/', '/tools/github-copilot/']

const failures = []
const browser = await chromium.launch()
console.log(`\nnothing hidden from a client that does not scroll\n  base ${BASE}\n`)

// Tall viewport, page loaded, nothing scrolled: what a renderer sees if it takes
// one snapshot of the document.
const page = await browser.newPage({ viewport: { width: 1280, height: 5000 } })

for (const path of PATHS) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' })
  const r = await page.evaluate(() => {
    const hidden = []
    for (const el of document.querySelectorAll('h1,h2,h3,p,td,li,figcaption')) {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue   // deliberately hidden, not animated away
      if (parseFloat(cs.opacity) < 0.99) {
        hidden.push(`<${el.tagName.toLowerCase()}> ${(el.textContent || '').trim().slice(0, 40)}`)
      }
    }
    return hidden
  })
  const ok = r.length === 0
  console.log(`  ${ok ? 'ok ' : 'FAIL'} ${path.padEnd(14)} ${ok ? 'every element at full opacity' : `${r.length} below full opacity`}`)
  for (const h of r.slice(0, 5)) console.log(`         ${h}`)
  if (!ok) failures.push(path)
}

await browser.close()
if (failures.length) {
  console.error(`\nvisibility check FAILED on ${failures.join(', ')}\n`)
  console.error('An entry animation may move content and may not hide it. Anything that')
  console.error('starts at opacity 0 stays there for a client that never scrolls to it.\n')
  process.exit(1)
}
console.log('\nan animation moves content here, it never hides it\n')

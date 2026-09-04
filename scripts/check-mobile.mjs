// Horizontal overflow on a phone, measured rather than eyeballed.
//
// The reading path ships no JavaScript, so nothing can correct a layout at
// runtime and a page that overflows stays overflowed. A reader on a phone gets
// a page that slides sideways under the thumb and a body of text narrower than
// the screen, which is the single most visible way a site looks unfinished.
//
// Reports the widest offending element rather than only the fact of overflow,
// because "the document is 40px too wide" is not actionable and "this <table>
// is 40px too wide" is.
import { chromium } from 'playwright'

const BASE = process.argv[3] || process.env.BASE || 'http://127.0.0.1:8811'
const PATHS = (process.argv[2] || '/,/papers/,/papers/retry-storm/,/impl/,/impl/mevrik-cx/,/errata/,/cv/,/history/,/tools/,/tools/in/ai-assistants/,/tools/in/editors/,/tools/github-copilot/').split(',')

// iPhone SE is the narrowest screen still in wide use, so it is the one that
// finds problems. 390 is a current iPhone, 360 the common Android width.
const VIEWPORTS = [
  { name: 'Android      360', width: 360, height: 740 },
  { name: 'iPhone SE    375', width: 375, height: 667 },
  { name: 'iPhone 14    390', width: 390, height: 844 },
  { name: 'below 520    519', width: 519, height: 900 },
  { name: 'above 520    521', width: 521, height: 900 },
  { name: 'below 560    559', width: 559, height: 900 },
  { name: 'above 560    561', width: 561, height: 900 },
  { name: 'below 600    599', width: 599, height: 900 },
  { name: 'above 600    601', width: 601, height: 900 },
  { name: 'landscape    667', width: 667, height: 375 },
  { name: 'small tablet 700', width: 700, height: 900 },
  { name: 'below 760    759', width: 759, height: 900 },
  { name: 'above 760    761', width: 761, height: 900 },
  { name: 'iPad         768', width: 768, height: 1024 },
]

const browser = await chromium.launch()
let failures = 0
console.log('\nhorizontal overflow on a phone\n')

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  console.log(`  ${vp.name}`)

  for (const path of PATHS) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'load' })
    const r = await page.evaluate((vw) => {
      const doc = document.documentElement
      const over = Math.max(0, doc.scrollWidth - vw)
      const worst = []
      if (over > 0) {
        for (const el of document.querySelectorAll('body *')) {
          const b = el.getBoundingClientRect()
          if (b.width === 0 && b.height === 0) continue
          const right = b.right
          const spill = Math.round(right - vw)
          if (spill > 0) {
            // The element that spills and whose parent does not is the cause;
            // everything above it is just inheriting the width.
            const p = el.parentElement
            const pSpill = p ? Math.round(p.getBoundingClientRect().right - vw) : 0
            if (pSpill <= 0 || spill > pSpill) {
              worst.push({
                tag: el.tagName.toLowerCase(),
                cls: (el.className && String(el.className).slice(0, 34)) || '',
                spill,
                w: Math.round(b.width),
                text: (el.textContent || '').trim().slice(0, 38),
              })
            }
          }
        }
      }
      worst.sort((a, b) => b.spill - a.spill)
      return { over: Math.round(over), scroll: Math.round(doc.scrollWidth), worst: worst.slice(0, 4) }
    }, vp.width)

    if (r.over > 0) {
      failures++
      console.log(`    FAIL ${path.padEnd(24)} document ${r.scroll}px, ${r.over}px past the viewport`)
      for (const w of r.worst) {
        console.log(`         <${w.tag}${w.cls ? ' class="' + w.cls + '"' : ''}> ${w.w}px wide, +${w.spill}  ${w.text ? '"' + w.text + '"' : ''}`)
      }
    } else {
      console.log(`    ok   ${path.padEnd(24)} ${r.scroll}px`)
    }
  }
  await ctx.close()
  console.log('')
}

await browser.close()
if (failures) {
  console.error(`mobile check FAILED: ${failures} page-viewport combinations overflow\n`)
  process.exit(1)
}
console.log('no page scrolls sideways at any checked width from 360 to 768\n')

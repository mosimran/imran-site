// axe-core and htmlcs against the live site, in both colour schemes. The palette
// is defined twice, so checking one scheme checks half the site.
import { execSync } from 'node:child_process'
import pa11y from 'pa11y'
const BASE = process.env.BASE || 'https://mosthofaimran.com'
// A fixed core, plus every page carrying a drawn figure. The list used to be
// hand-maintained and named /impl/llm-gateway/ because it was the only written
// implementation note at the time. Notes 3.1 and 3.3 were written afterwards,
// both with diagrams, and neither was being checked. Drawn figures are the thing
// most likely to fail contrast, so they are the thing least worth remembering to
// add by hand.
const CORE = ['/', '/papers/', '/papers/competence-porn/', '/impl/llm-gateway/', '/errata/', '/cv/', '/history/']
const withFigures = execSync("grep -rl '<svg' dist --include=index.html", { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean)
  .map((f) => f.replace(/^dist/, '').replace(/index\.html$/, ''))
const PAGES = [...new Set([...CORE, ...withFigures])].sort()
const isLocal = /localhost|127\.0\.0\.1/.test(BASE)
console.log(`\na11y\n  base    ${BASE}${isLocal ? '' : '   <- the deployed site, not your build'}`)
console.log(`  pages   ${PAGES.length}, both colour schemes`)
let total = 0
let undecidedTotal = 0
for (const scheme of ['light', 'dark']) {
  for (const path of PAGES) {
    const r = await pa11y(BASE + path, {
      standard: 'WCAG2AA',
      runners: ['axe', 'htmlcs'],
      chromeLaunchConfig: { args: ['--no-sandbox', `--force-color-profile=srgb`] },
      userAgent: 'pa11y',
      timeout: 45000,
      // Emulate the scheme the visitor would actually have.
      actions: [],
      launchConfig: {},
      ...(scheme === 'dark' ? { chromeLaunchConfig: { args: ['--no-sandbox', '--force-dark-mode'] } } : {}),
    })
    const all = r.issues.filter((i) => i.type === 'error')

    // axe cannot resolve the backdrop of text inside an <svg>. It returns
    // `incomplete` with contrastRatio 0, meaning "cannot judge", and pa11y
    // reports that as an error. Counting it as a defect would be as wrong as
    // hiding it, so it is separated out and shown, and the property it declined
    // to judge is asserted for real in scripts/check-contrast.mjs.
    const undecided = all.filter((i) => i.code === 'color-contrast' && /\bsvg\b/.test(i.selector || ''))
    const errs = all.filter((i) => !undecided.includes(i))

    total += errs.length
    undecidedTotal += undecided.length
    const note = undecided.length ? `  (+${undecided.length} axe could not judge inside svg)` : ''
    console.log(`  ${errs.length === 0 ? 'ok ' : 'FAIL'} ${scheme.padEnd(5)} ${path.padEnd(30)} ${errs.length} errors${note}`)
    errs.slice(0, 4).forEach((e) => console.log(`         ${e.code}: ${e.message.slice(0, 90)}`))
  }
}
console.log(`\n  total WCAG2AA errors: ${total}`)
if (undecidedTotal) {
  console.log(`  ${undecidedTotal} contrast results axe declined to judge inside <svg>.`)
  console.log('  Those pairs are asserted numerically by scripts/check-contrast.mjs.')
}
console.log('')
process.exit(total ? 1 : 0)

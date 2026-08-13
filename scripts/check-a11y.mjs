// axe-core and htmlcs against the live site, in both colour schemes. The palette
// is defined twice, so checking one scheme checks half the site.
import pa11y from 'pa11y'
const BASE = process.env.BASE || 'https://mosthofaimran.com'
const PAGES = ['/', '/papers/', '/papers/competence-porn/', '/impl/llm-gateway/', '/errata/', '/cv/']
let total = 0
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
    const errs = r.issues.filter((i) => i.type === 'error')
    total += errs.length
    console.log(`  ${errs.length === 0 ? 'ok ' : 'FAIL'} ${scheme.padEnd(5)} ${path.padEnd(30)} ${errs.length} errors`)
    errs.slice(0, 4).forEach((e) => console.log(`         ${e.code}: ${e.message.slice(0, 90)}`))
  }
}
console.log(`\n  total WCAG2AA errors: ${total}\n`)
process.exit(total ? 1 : 0)

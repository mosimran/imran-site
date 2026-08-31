// WCAG AA contrast for the drawn figures, computed rather than trusted.
//
// axe cannot resolve the backdrop of text inside an <svg>: it returns
// `incomplete` with contrastRatio 0, and pa11y reports that as an error. The
// tool is being honest, it genuinely cannot judge. Silencing it and moving on
// would leave the property unchecked, so this asserts the property directly.
//
// Tokens are parsed out of the stylesheet rather than restated here, because a
// copy of a colour is a colour that can drift from the one being shipped.
import { readFileSync } from 'node:fs'

const css = readFileSync('src/styles/rfc.css', 'utf8')
const dark = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'))

const token = (scope, name) => (scope.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-f]{6})`, 'i')) || [])[1]
const tint = (css.match(/\.dia \.ab\{[^}]*fill-opacity:\s*\.?(\d+)/) || [])[1]
const ALPHA = tint ? Number('0.' + tint) : null

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = (h) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) }
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
const over = (fg, bg, a) => '#' + hex(fg).map((v, i) => Math.round(v * a + hex(bg)[i] * (1 - a)).toString(16).padStart(2, '0')).join('')

// Every text colour the drawn figures use, on every ground they sit on. Text is
// under 18.66px throughout, so AA is 4.5:1 with no large-text exemption.
const AA = 4.5
let failures = 0
console.log('\ndrawn-figure contrast (WCAG AA, 4.5:1)\n')

if (ALPHA === null) {
  console.error('  could not read .dia .ab fill-opacity from rfc.css\n')
  process.exit(1)
}

for (const [scheme, scope] of [['light', css.slice(0, css.indexOf('@media'))], ['dark', dark]]) {
  const t = Object.fromEntries(['sheet', 'ink', 'dim', 'accent', 'warn'].map((n) => [n, token(scope, n)]))
  const missing = Object.entries(t).filter(([, v]) => !v).map(([k]) => k)
  if (missing.length) { console.error(`  ${scheme}: tokens not found: ${missing.join(', ')}\n`); process.exit(1) }
  const tinted = over(t.accent, t.sheet, ALPHA)

  console.log(`  ${scheme}  sheet ${t.sheet}  window fill ${tinted} (accent at ${ALPHA})`)
  for (const [label, fg, bg] of [
    ['ink on sheet', t.ink, t.sheet],
    ['dim on sheet', t.dim, t.sheet],
    ['warn on sheet', t.warn, t.sheet],
    ['accent on sheet', t.accent, t.sheet],
    ['ink on window fill', t.ink, tinted],
    ['dim on window fill', t.dim, tinted],
    ['accent on window fill', t.accent, tinted],
  ]) {
    const r = ratio(fg, bg)
    const ok = r >= AA
    if (!ok) failures++
    console.log(`    ${ok ? 'ok  ' : 'FAIL'} ${r.toFixed(2).padStart(5)}:1  ${label}`)
  }
  console.log('')
}

if (failures) {
  console.error(`contrast check FAILED: ${failures} pair(s) below ${AA}:1.`)
  console.error('Adjust the token or the .dia .ab fill-opacity in src/styles/rfc.css.\n')
  process.exit(1)
}
console.log(`  all pairs at or above ${AA}:1 in both schemes\n`)

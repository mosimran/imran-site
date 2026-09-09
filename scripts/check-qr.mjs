// The QR code on /scan/ has to decode, and it has to decode to this author.
//
// A QR is the one thing on this site that can be completely wrong while looking
// completely right. Every module can be drawn, the page can pass every other
// check, the contrast can be perfect, and the code can still carry nothing a
// camera will read: an off-by-one in the module runs, an antialiased edge, a
// quiet zone the CSS ate, an inverted palette in dark mode.
//
// So this does not inspect the SVG. It renders the built page in a browser,
// photographs the code the way a phone would, and decodes it. Then it checks the
// decoded text against dist/contact.vcf field by field, because a code that
// decodes to somebody else's details is not a pass.
//
// Run against a served build:  node scripts/check-qr.mjs [base]
//
// A served build, and not production. Decoding needs jsQR running in the page,
// and the deployed CSP is `script-src` with one named host, so it refuses the
// injected script and this fails with a CSP violation rather than a QR problem.
// That refusal is the policy working. CI serves dist on localhost and runs it
// there, which is where it belongs anyway: the point is to check the artifact
// before it ships, not after.
import { readFileSync, existsSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = (process.argv[2] || process.env.BASE || 'http://127.0.0.1:8811').replace(/\/$/, '')
const JSQR = 'node_modules/jsqr/dist/jsQR.js'

for (const f of ['dist/contact.vcf', JSQR]) {
  if (!existsSync(f)) {
    console.error(`\nqr check: ${f} missing${f.endsWith('.vcf') ? ', run a build first' : ''}\n`)
    process.exit(1)
  }
}

const card = readFileSync('dist/contact.vcf', 'utf8')
// Unfold first: RFC 6350 continuation lines begin with a space, and a value read
// without joining them is a truncated value.
const unfolded = card.replace(/\r\n[ \t]/g, '')
const cardField = (name) =>
  (unfolded.match(new RegExp(`^${name}[^:]*:(.+)$`, 'm')) || [])[1]?.trim().replace(/\\([\\,;])/g, '$1')

const failures = []
const pass = (label, ok, detail) => {
  console.log(`  ${ok ? 'ok ' : 'FAIL'} ${label.padEnd(38)} ${detail}`)
  if (!ok) failures.push(label)
}

console.log('\nthe QR code at /scan/ decodes\n')

const browser = await chromium.launch()
const results = {}

/*
 * Both colour schemes. The drawing paints its own white background precisely so
 * that dark mode cannot invert it, and that is an assertion rather than a
 * comment: if a future stylesheet reaches into the SVG, the dark run fails here
 * rather than in somebody's hand at a conference.
 */
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 900, height: 1200 } })
  const page = await ctx.newPage()
  const resp = await page.goto(`${BASE}/scan/`, { waitUntil: 'load' })
  if (!resp || !resp.ok()) {
    console.error(`\nqr check: ${BASE}/scan/ returned ${resp ? resp.status() : 'nothing'}\n`)
    await browser.close()
    process.exit(1)
  }
  await page.addScriptTag({ path: JSQR })

  // Rasterise the code at 4 device pixels per module, which is roughly what a
  // phone camera resolves holding a handset in front of a laptop screen.
  const out = await page.evaluate(async () => {
    const svg = document.querySelector('.qrbox svg')
    if (!svg) return { error: 'no svg found in .qrbox' }
    const box = svg.viewBox.baseVal
    const scale = 4
    const w = Math.round(box.width * scale)
    const h = Math.round(box.height * scale)

    const clone = svg.cloneNode(true)
    clone.setAttribute('width', String(w))
    clone.setAttribute('height', String(h))
    const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(clone))))

    const img = new Image()
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('svg failed to load')); img.src = url })

    const cv = document.createElement('canvas')
    cv.width = w; cv.height = h
    const c = cv.getContext('2d')
    c.drawImage(img, 0, 0, w, h)
    const data = c.getImageData(0, 0, w, h)

    // The computed background actually painted behind the code, so an inverted
    // rendering is caught rather than assumed away.
    const corner = c.getImageData(1, 1, 1, 1).data
    const found = window.jsQR(data.data, w, h)
    return {
      text: found ? found.data : null,
      modules: box.width,
      corner: `rgb(${corner[0]},${corner[1]},${corner[2]})`,
    }
  })

  if (out.error) {
    pass(`${scheme}: code present in the page`, false, out.error)
    await ctx.close()
    continue
  }
  pass(`${scheme}: decodes`, Boolean(out.text), out.text ? `${out.text.length} chars` : 'jsQR returned nothing')
  pass(`${scheme}: background is light`, out.corner === 'rgb(255,255,255)', out.corner)
  results[scheme] = out.text
  await ctx.close()
}
await browser.close()

const text = results.light
if (!text) {
  console.error('\nqr check FAILED: nothing decoded, so nothing can be compared\n')
  process.exit(1)
}

pass('both schemes decode the same bytes', results.light === results.dark,
  results.light === results.dark ? 'identical' : 'light and dark differ')

// A phone parses this as a vCard, so it has to look like one.
pass('decodes to a vCard', /^BEGIN:VCARD\r?\n/.test(text) && /END:VCARD\r?\n?$/.test(text),
  text.split(/\r?\n/)[0])
pass('is vCard 4.0', /^VERSION:4\.0$/m.test(text), (text.match(/^VERSION:(.+)$/m) || [])[1] ?? 'none')

const qrField = (name) =>
  (text.match(new RegExp(`^${name}[^:]*:(.+)$`, 'm')) || [])[1]?.trim().replace(/\\([\\,;])/g, '$1')

/*
 * Field by field against the downloadable card. The QR is deliberately shorter,
 * so this checks the properties both carry rather than requiring equality.
 */
for (const name of ['FN', 'N', 'TITLE', 'ORG', 'EMAIL', 'TEL', 'UID', 'ADR']) {
  const a = qrField(name)
  const b = cardField(name)
  pass(`${name} matches the download`, Boolean(a) && a === b, a ? a.slice(0, 46) : '(absent from the code)')
}

// The number is the reason this page exists, so it is asserted as a number
// rather than as a property that happens to be present.
const tel = qrField('TEL') || ''
pass('the number is an E.164 tel: URI', /^tel:\+[1-9]\d{7,14}$/.test(tel), tel || '(absent)')

console.log('')
if (failures.length) {
  console.error(`qr check FAILED: ${failures.join(', ')}\n`)
  console.error('A code that does not decode is a blank square. Check src/lib/qr.ts, and check')
  console.error('that no stylesheet has reached inside .qrbox svg to recolour it.\n')
  process.exit(1)
}
console.log('the code scans, in both schemes, and carries the same contact as the card\n')

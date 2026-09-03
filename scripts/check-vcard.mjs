// The vCard and Section 14 must say the same things.
//
// They are generated from one source, lib/contact.ts, which is the fix rather
// than the guarantee: Section 14 is hand-written HTML and could be edited on its
// own. This asserts the two still agree, because a downloadable card that
// disagrees with the page is worse than no card. The role string has drifted
// across surfaces here before, which is erratum 7.9.
import { readFileSync, existsSync } from 'node:fs'

const CARD = 'dist/contact.vcf'
const INDEX = 'dist/index.html'
for (const f of [CARD, INDEX]) {
  if (!existsSync(f)) { console.error(`vcard check: ${f} missing, run a build first`); process.exit(1) }
}

const card = readFileSync(CARD, 'utf8')
const html = readFileSync(INDEX, 'utf8')

// Section 14 only. Matching the whole page would pass on text that happens to
// appear anywhere, which is the mistake the provenance scan made in 7.19.
const start = html.indexOf('id="s14"')
const end = html.indexOf('</table>', start)
if (start < 0 || end < 0) { console.error('vcard check: Section 14 not found in dist/index.html'); process.exit(1) }
const s14 = html.slice(start, end).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

const field = (name) => (card.match(new RegExp(`^${name}[^:]*:(.+)$`, 'm')) || [])[1]?.trim().replace(/\\([\\,;])/g, '$1')

const failures = []
const pass = (label, ok, detail) => {
  console.log(`  ${ok ? 'ok ' : 'FAIL'} ${label.padEnd(34)} ${detail}`)
  if (!ok) failures.push(label)
}

console.log('\nvCard against Section 14\n')

const checks = [
  ['name in Section 14', field('FN')],
  ['role in Section 14', field('TITLE')],
  ['email in Section 14', field('EMAIL')],
]
for (const [label, value] of checks) {
  pass(label, Boolean(value) && s14.includes(value), value ?? '(absent from card)')
}

// The address is split across vCard components, so it is checked by part.
const adr = field('ADR') || ''
const [city, country] = [adr.split(';')[3], adr.split(';')[6]]
pass('city in Section 14', Boolean(city) && s14.includes(city), city || '(absent)')
pass('country in Section 14', Boolean(country) && s14.includes(country), country || '(absent)')

// github.com/mosimran on the page, https://github.com/mosimran in the card.
const code = (card.match(/^URL;TYPE=code:(.+)$/m) || [])[1]?.trim() ?? ''
pass('code host in Section 14', Boolean(code) && s14.includes(code.replace(/^https?:\/\//, '')), code || '(absent)')

pass('card is vCard 4.0', /^VERSION:4\.0$/m.test(card), (card.match(/^VERSION:(.+)$/m) || [])[1] ?? 'none')
pass('card is CRLF terminated', card.includes('\r\n'), card.includes('\r\n') ? 'yes' : 'LF only')
pass('every line within 75 octets', card.split('\r\n').every((l) => Buffer.byteLength(l) <= 75),
  `longest ${Math.max(...card.split('\r\n').map((l) => Buffer.byteLength(l)))}`)

console.log('')
if (failures.length) {
  console.error(`vcard check FAILED: ${failures.join(', ')}\n`)
  if (failures.some((f) => f.includes('Section 14'))) {
    console.error('The card and Section 14 have diverged. Both read lib/contact.ts, so a')
    console.error('mismatch means Section 14 was edited by hand and the source was not.')
  }
  if (failures.some((f) => f.includes('octets') || f.includes('vCard 4.0') || f.includes('CRLF'))) {
    console.error('The card is malformed against RFC 6350. Check the folding in lib/contact.ts.')
  }
  console.error('')
  process.exit(1)
}
console.log('the card and the page say the same things\n')

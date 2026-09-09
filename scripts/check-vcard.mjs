// The vCard and Section 14 must say the same things.
//
// They are generated from one source, lib/contact.ts, which is the fix rather
// than the guarantee: Section 14 is hand-written HTML and could be edited on its
// own. This asserts the two still agree, because a downloadable card that
// disagrees with the page is worse than no card. The role string has drifted
// across surfaces here before, which is erratum 7.9.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const walkHtml = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walkHtml(p, out)
    else if (p.endsWith('.html')) out.push(p)
  }
  return out
}

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

// Unfold before reading: RFC 6350 continuation lines begin with a space, and a
// value read without joining them is a truncated value.
const unfolded = card.replace(/\r\n[ \t]/g, '')
const field = (name) => (unfolded.match(new RegExp(`^${name}[^:]*:(.+)$`, 'm')) || [])[1]?.trim().replace(/\\([\\,;])/g, '$1')

const failures = []
const pass = (label, ok, detail) => {
  console.log(`  ${ok ? 'ok ' : 'FAIL'} ${label.padEnd(34)} ${detail}`)
  if (!ok) failures.push(label)
}

console.log('\nvCard against Section 14\n')

const checks = [
  ['name in Section 14', field('FN')],
  ['role in Section 14', field('TITLE')],
  ['organisation in Section 14', field('ORG')],
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

/*
 * The touchpoints. Each URL carries a group prefix and a label, so an address
 * book names the row instead of calling all four of them "home page".
 */
const items = [...unfolded.matchAll(/^item(\d+)\.URL:(.+)$/gm)].map(([, n, u]) => ({ n, u: u.trim() }))
pass('touchpoint URLs are grouped', items.length >= 2, `${items.length} labelled URLs`)
const unlabelled = items.filter((i) => !new RegExp(`^item${i.n}\\.X-ABLabel:.+$`, 'm').test(unfolded))
pass('every touchpoint has a label', unlabelled.length === 0,
  unlabelled.length ? unlabelled.map((i) => i.u).join(', ') : items.map((i) => i.u.replace(/^https?:\/\//, '')).join(' '))

// github.com/johnefemer on the page, https://github.com/johnefemer in the card.
const code = items.map((i) => i.u).find((u) => /github\.com/.test(u)) ?? ''
pass('code host in Section 14', Boolean(code) && s14.includes(code.replace(/^https?:\/\//, '')), code || '(absent)')

/*
 * The properties an address book needs to file this correctly, none of which
 * were on the card before 2026-09-10.
 *
 * UID matters most. Without it, a second download is a second contact rather
 * than an update to the first, which is the difference between a card that
 * maintains itself and one that leaves duplicates behind on every phone that
 * ever scanned it.
 */
pass('has ORG', Boolean(field('ORG')), field('ORG') ?? '(absent)')
pass('has KIND', /^KIND:individual$/m.test(unfolded), (unfolded.match(/^KIND:(.+)$/m) || [])[1] ?? '(absent)')
pass('has a stable UID', Boolean(field('UID')) && /^[a-z][a-z0-9+.-]*:/i.test(field('UID')),
  field('UID') ?? '(absent)')
pass('has PRODID', Boolean(field('PRODID')), field('PRODID') ?? '(absent)')

// The number, as an E.164 tel: URI rather than as free text a client has to guess at.
const tel = field('TEL') ?? ''
pass('phone is an E.164 tel: URI', /^tel:\+[1-9]\d{7,14}$/.test(tel), tel || '(absent)')

/*
 * And the shape of its parameters, which is not pedantry.
 *
 * Written as TEL;TYPE="cell,voice,text";VALUE=uri this row shipped and appeared
 * in macOS Contacts labelled VALUE rather than mobile: that parser does not take
 * a quoted comma list and falls back to naming the last parameter it saw. So
 * both properties are asserted. No quoted list, and TYPE last.
 */
const telParams = (unfolded.match(/^TEL((?:;[^:]+)*):/m) || [])[1] ?? ''
pass('phone TYPE is not a quoted list', !/TYPE="[^"]*,/.test(telParams), telParams || '(none)')
pass('phone TYPE is the last parameter', /;TYPE=[^;:"]+$/.test(telParams), telParams || '(none)')

/*
 * And the negative, which is the owner's decision on 2026-09-10 rather than a
 * detail of formatting: the number ships in the card and in the QR at /scan/,
 * and it does not ship in the markup. A number in a downloadable card is
 * reachable by anyone who wants it; a number in the HTML is reachable by
 * everyone who scrapes it.
 *
 * The QR encodes it as vector paths, which is not the digit string, so this
 * scan does not trip on the page that exists to carry it.
 */
const digits = tel.replace(/^tel:/, '')
const leaked = walkHtml('dist').filter((f) => readFileSync(f, 'utf8').includes(digits))
pass('phone is not in any page HTML', digits !== '' && leaked.length === 0,
  leaked.length ? leaked.slice(0, 3).join(', ') : `${digits} appears in 0 of the built pages`)

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

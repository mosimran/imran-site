// One source for the author's contact facts.
//
// Section 14 publishes these on the page, the JSON-LD carries them for machines,
// and /contact.vcf hands them to an address book. Three surfaces, and the site's
// own history says what happens when a fact is typed into more than one of them:
// the role string drifted across eight places (erratum 7.9) and the Section 3
// table contradicted an erratum on the front page (erratum 7.15).
//
// Nothing here is new. Every field already appears in Section 14, and
// scripts/check-vcard.mjs asserts that it still does.

export const contact = {
  name: 'Mosthofa Imran',
  family: 'Imran',
  given: 'Mosthofa',
  role: 'Head of Engineering and Delivery',
  email: 'hey@mosthofaimran.com',
  site: 'https://mosthofaimran.com',
  code: 'https://github.com/mosimran',
  city: 'Dhaka',
  country: 'Bangladesh',
  tzOffset: '+06:00',
  note: 'Systems carry numbers, arguments carry a confidence value, and Section 7 records what turned out to be wrong.',
} as const

// vCard 4.0, RFC 6350. CRLF endings, because the RFC says so and some address
// books care.
//
// Lines are folded at 75 octets per section 3.2. An earlier version of this file
// asserted that folding was unnecessary because every line was short; the NOTE
// line was 116 octets and the assertion was simply wrong. scripts/check-vcard.mjs
// measures it now rather than taking a comment's word for it.
//
// Folding counts octets rather than characters and never splits a multi-byte
// sequence, because a card cut through the middle of a UTF-8 character is a card
// that fails to parse.
export function vcard(rev: Date): string {
  const esc = (v: string) => v.replace(/([\\,;])/g, '\\$1')
  const lines = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    `FN:${esc(contact.name)}`,
    `N:${esc(contact.family)};${esc(contact.given)};;;`,
    `TITLE:${esc(contact.role)}`,
    `EMAIL;TYPE=work:${contact.email}`,
    `URL:${contact.site}/`,
    `URL;TYPE=code:${contact.code}`,
    `ADR;TYPE=work:;;;${esc(contact.city)};;;${esc(contact.country)}`,
    `TZ:${contact.tzOffset}`,
    `NOTE:${esc(contact.note)}`,
    `SOURCE:${contact.site}/contact.vcf`,
    `REV:${rev.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    'END:VCARD',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

function fold(line: string): string {
  if (Buffer.byteLength(line) <= 75) return line
  const out: string[] = []
  let cur = ''
  let limit = 75
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > limit) {
      out.push(cur)
      cur = ' ' + ch   // a continuation line begins with one space
      limit = 75
    } else {
      cur += ch
    }
  }
  if (cur) out.push(cur)
  return out.join('\r\n')
}

// One source for the author's contact facts.
//
// Section 14 publishes these on the page, the JSON-LD carries them for machines,
// /contact.vcf hands them to an address book and /scan/ draws them as a QR code.
// Four surfaces, and the site's own history says what happens when a fact is
// typed into more than one of them: the role string drifted across eight places
// (erratum 7.9) and the Section 3 table contradicted an erratum on the front
// page (erratum 7.15).
//
// Erratum 7.9 said the role was corrected in all eight places. It was, and then
// only three of the eight were wired to read from here. The other five kept
// their own copy of the string, so the next role change would have reopened the
// same defect. They all read from this file now, and scripts/check-role.mjs
// fails the build if the string reappears anywhere else.

export const contact = {
  name: 'Mosthofa Imran',
  family: 'Imran',
  given: 'Mosthofa',

  // The owner's words, chosen by him on 2026-09-10. "Chief Technology Officer"
  // was offered and "CTO" was picked. Erratum 7.9 is the reason that is a
  // recorded decision rather than a detail: this document published a title its
  // author did not hold for a year, and the fix was to use the exact string he
  // uses himself.
  role: 'CTO',
  org: 'Betopia Limited',

  email: 'hey@mosthofaimran.com',

  // Published in /contact.vcf and in the QR at /scan/, deliberately not in the
  // page HTML. The owner's decision on 2026-09-10: a number in a downloadable
  // card is reachable by anyone who wants it, and a number in the markup is
  // reachable by everyone who scrapes it. Section 14 points at the card.
  tel: '+8801753891285',

  site: 'https://mosthofaimran.com',
  code: 'https://github.com/johnefemer',
  city: 'Dhaka',
  country: 'Bangladesh',
  tzOffset: '+06:00',
  note: 'Systems carry numbers, arguments carry a confidence value, and Section 7 records what turned out to be wrong.',
} as const

/** "CTO, Betopia Limited". The masthead, Section 14 and the share card. */
export const roleLine = `${contact.role}, ${contact.org}`

/*
 * Where to reach him professionally, in the order a stranger would want them.
 * The card labels each one; the site publishes every one of them already.
 */
export const touchpoints: ReadonlyArray<readonly [string, string]> = [
  ['Website', `${contact.site}/`],
  ['Code', contact.code],
  ['Papers', `${contact.site}/papers/`],
  ['CV', `${contact.site}/cv/`],
]

/** "CTO at Betopia Limited". Inline prose: meta descriptions, alt text, llms.txt. */
export const roleAt = `${contact.role} at ${contact.org}`

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
  const lines = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    // KIND says this card describes a person rather than an organisation or a
    // group. Section 6.1.4 makes it optional and defaults it to `individual`,
    // and stating it costs one line and removes a guess.
    'KIND:individual',
    `FN:${esc(contact.name)}`,
    `N:${esc(contact.family)};${esc(contact.given)};;;`,
    `TITLE:${esc(contact.role)}`,
    `ORG:${esc(contact.org)}`,
    `EMAIL;TYPE=work:${contact.email}`,
    /*
     * Plain text, not a tel: URI, and no VALUE parameter.
     *
     * RFC 6350 section 6.4.1 says the value is free-form text by default, for
     * backward compatibility with vCard 3, and SHOULD be reset to a URI. This
     * departs from that SHOULD on purpose, and the reason is a screenshot.
     *
     * Written as `TEL;TYPE="cell,voice,text";VALUE=uri:tel:...` the row appeared
     * in macOS Contacts labelled **VALUE**, with `tel:` shown as part of the
     * number. Rewritten as `TEL;VALUE=uri;TYPE=cell:tel:...`, unquoted and with
     * TYPE last, it did exactly the same thing. That client does not read the
     * VALUE parameter on TEL at all: it names the row after it and prints the
     * URI scheme as if it were digits.
     *
     * EMAIL and ADR on this same card carry TYPE=work and display correctly, so
     * TYPE is not the problem and never was. Removing VALUE is the fix, and a
     * plain number is what every address book since 1998 expects.
     *
     * A specification that a reader's software will not follow is not a
     * specification this card gets to insist on.
     */
    `TEL;TYPE=cell:${contact.tel}`,
    /*
     * The professional touchpoints, each one labelled.
     *
     * Two bare URL lines both showed as "home page" in macOS Contacts, which is
     * what that client calls a URL it has no name for. The `itemN.` group prefix
     * is ordinary vCard grouping from RFC 6350 section 3.3, and X-ABLabel is the
     * extension Apple reads to name the row. A client that does not know the
     * extension sees four URL properties and ignores the labels, which is the
     * correct degradation.
     *
     * Everything here is a page this site already publishes. No handle on any
     * feed-ranked platform appears, because Section 14 says plainly that those
     * exist so people can reach him and are not somewhere he publishes.
     */
    ...touchpoints.flatMap(([label, url], i) => [
      `item${i + 1}.URL:${url}`,
      `item${i + 1}.X-ABLabel:${esc(label)}`,
    ]),
    `ADR;TYPE=work:;;;${esc(contact.city)};;;${esc(contact.country)}`,
    `TZ:${contact.tzOffset}`,
    `NOTE:${esc(contact.note)}`,
    // A stable identity for the card, so an address book updating from a second
    // download replaces the entry rather than adding a duplicate. It has to be a
    // URI, and the person's own canonical URL is the one URI here that is never
    // going to change.
    `UID:${contact.site}/#person`,
    `SOURCE:${contact.site}/contact.vcf`,
    `PRODID:-//mosthofaimran.com//contact.vcf//EN`,
    `REV:${rev.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    'END:VCARD',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

/*
 * The card the QR at /scan/ carries.
 *
 * Shorter than the download, on purpose. A QR grows with its payload, and a
 * denser code is a code that fails on a bad camera at an angle in poor light,
 * which is the only situation this one will ever be used in. So the properties
 * that matter to a phone adding a contact are here and the ones that matter to
 * a file are not: no NOTE, no SOURCE, no PRODID, and no REV.
 *
 * REV in particular is excluded because it changes every build. A QR that
 * changes when nothing about the contact changed is a diff nobody can review
 * and a check nobody can pin.
 */
export function vcardCompact(): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    'KIND:individual',
    `FN:${esc(contact.name)}`,
    `N:${esc(contact.family)};${esc(contact.given)};;;`,
    `TITLE:${esc(contact.role)}`,
    `ORG:${esc(contact.org)}`,
    `TEL;TYPE=cell:${contact.tel}`,
    `EMAIL;TYPE=work:${contact.email}`,
    `URL:${contact.site}/`,
    `ADR;TYPE=work:;;;${esc(contact.city)};;;${esc(contact.country)}`,
    `UID:${contact.site}/#person`,
    'END:VCARD',
  ]
  // Not folded. Folding is a rule about a vCard in a file, and a QR payload is
  // handed to a parser as one string; the continuation spaces would survive
  // into some clients as part of the value.
  return lines.join('\r\n') + '\r\n'
}

const esc = (v: string) => v.replace(/([\\,;])/g, '\\$1')

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

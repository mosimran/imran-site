// The Internet-Draft identifier and its expiry. PLAN section 1.
//
// The version suffix is history.length - 1, zero padded: first publication is
// -00. Nothing to maintain and nothing that can drift, because it is computed.
//
// A real Internet-Draft expires 185 days after posting. That rule is the most
// useful thing the form offers a site whose argument is that unrevised claims
// decay, so it is kept rather than decorated.

export const EXPIRY_DAYS = 185

export function version(historyLength: number): string {
  return String(Math.max(0, historyLength - 1)).padStart(2, '0')
}

export function identifier(slug: string, historyLength: number): string {
  return `draft-imran-${slug}-${version(historyLength)}`
}

export function expiresOn(revised: Date): Date {
  const d = new Date(revised)
  d.setUTCDate(d.getUTCDate() + EXPIRY_DAYS)
  return d
}

export function isExpired(revised: Date, now = new Date()): boolean {
  return expiresOn(revised) < now
}

export function fmt(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// The masthead's document date, which is a month and a year rather than a day.
// It exists because that line was typed by hand while `Expires` beside it was
// computed, so the two could drift apart the first time the document was
// revised in a different month. Same input, both derived.
export function fmtMonth(d: Date): string {
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

import type { APIRoute } from 'astro'
import { contact, vcard } from '../lib/contact'
import { history } from '../lib/history'

// The card is generated rather than committed, so it cannot drift from the
// contact facts the page publishes. REV is the document's own last revision:
// an address book uses it to decide whether an update is newer, and inventing a
// build timestamp would make every deploy look like a contact change.
export const GET: APIRoute = () =>
  new Response(vcard(new Date(history[0].date)), {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${contact.family.toLowerCase()}-${contact.given.toLowerCase()}.vcf"`,
    },
  })

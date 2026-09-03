// JSON-LD builders. Every node carries the licence and the attribution request,
// so reuse terms travel with the data rather than living only in prose.
import { contact } from './contact'

const SITE = 'https://mosthofaimran.com'
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/'
const ASK = 'If you quote a claim, carry its confidence value with it. A 0.60 claim repeated as fact is no longer the author’s claim.'

// Fields come from lib/contact.ts, which /contact.vcf also reads. The name,
// role, email and location were typed here and in Section 14 separately until
// 2026-09-03; the role string had already drifted across eight places once,
// which is erratum 7.9.
export const person = () => ({
  '@type': 'Person',
  '@id': `${SITE}/#person`,
  name: contact.name,
  url: SITE,
  email: contact.email,
  jobTitle: contact.role,
  address: {
    '@type': 'PostalAddress',
    addressLocality: contact.city,
    addressCountry: contact.country,
  },
  sameAs: [contact.code],
  knowsAbout: ['Multi-tenant systems', 'Air-gapped deployment', 'LLM gateways', 'Data sovereignty'],
})

export const website = (ident: string) => ({
  '@context': 'https://schema.org',
  '@graph': [
    person(),
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: 'Mosthofa Imran',
      alternateName: ident,
      author: { '@id': `${SITE}/#person` },
      license: LICENSE,
      usageInfo: ASK,
      inLanguage: 'en',
    },
  ],
})

export function paper(d: {
  slug: string; section: string; title: string; summary: string
  identifier: string; state: string; confidence: number | null
  published?: Date; revised: Date; expires: Date; retires: string[]; seeAlso: string[]
}) {
  const iso = (x: Date) => x.toISOString().slice(0, 10)
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${SITE}/papers/${d.slug}/#article`,
    url: `${SITE}/papers/${d.slug}/`,
    headline: d.title,
    alternateName: d.identifier,
    description: d.summary,
    author: person(),
    datePublished: d.published ? iso(d.published) : undefined,
    dateModified: iso(d.revised),
    expires: iso(d.expires),
    license: LICENSE,
    usageInfo: ASK,
    inLanguage: 'en',
    encodingFormat: 'text/markdown',
    associatedMedia: { '@type': 'MediaObject', contentUrl: `${SITE}/papers/${d.slug}.md` },
    // The two properties the site exists to publish. A consumer that reads the
    // claim gets the numbers in the same object; it cannot take one without the other.
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'confidence', value: d.confidence ?? 'n/a',
        description: "The author's credence that the claim's central mechanism still holds in five years." },
      { '@type': 'PropertyValue', name: 'state', value: d.state },
      { '@type': 'PropertyValue', name: 'retirementConditions', value: d.retires.length,
        description: 'Count of stated conditions under which the author would withdraw this claim.' },
    ],
  }
}

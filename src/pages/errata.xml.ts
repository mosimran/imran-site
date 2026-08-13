import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
const SITE = 'https://mosthofaimran.com'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const iso = (d: Date) => d.toISOString().replace(/\.\d+Z$/, 'Z')

export const GET: APIRoute = async () => {
  const items = (await getCollection('errata')).sort((a, b) => +b.data.date - +a.data.date)
  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Mosthofa Imran: Errata and Retractions</title>
  <subtitle>Corrections to the document and its position papers</subtitle>
  <link href="${SITE}/errata.xml" rel="self" type="application/atom+xml"/>
  <link href="${SITE}/errata/" rel="alternate" type="text/html"/>
  <id>${SITE}/errata.xml</id>
  <updated>${iso(items[0]?.data.date ?? new Date())}</updated>
  <author><name>Mosthofa Imran</name><email>hey@mosthofaimran.com</email></author>
  <rights>CC BY 4.0</rights>
${items.map((e) => `  <entry>
    <title>${esc(e.data.section)} ${esc(e.data.title)}</title>
    <link href="${SITE}/errata/#e${e.data.section.replace('.', '-')}" rel="alternate" type="text/html"/>
    <id>tag:mosthofaimran.com,${e.data.date.getUTCFullYear()}:errata/${e.data.section}</id>
    <updated>${iso(e.data.date)}</updated>
    <category term="${esc(e.data.kind)}"/>
    <summary type="text">${esc(e.body.trim().replace(/\s+/g, ' '))}${e.data.creditedTo ? ` Reported by ${esc(e.data.creditedTo)}.` : ''}</summary>
  </entry>`).join('\n')}
</feed>
`
  return new Response(body, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } })
}

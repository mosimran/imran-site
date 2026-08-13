import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
const SITE = 'https://mosthofaimran.com'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const iso = (d: Date) => d.toISOString().replace(/\.\d+Z$/, 'Z')

export const GET: APIRoute = async () => {
  const papers = await getCollection('papers')
  const revs = papers.flatMap((p) =>
    p.data.history.map((h, i) => ({
      slug: p.slug, section: p.data.section, title: p.data.title,
      date: h.date, note: h.note, conf: h.confidenceAfter,
      rev: String(p.data.history.length - 1 - i).padStart(2, '0'),
    })),
  ).sort((a, b) => +b.date - +a.date)

  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Mosthofa Imran: Revisions</title>
  <subtitle>Every substantive edit to an existing paper</subtitle>
  <link href="${SITE}/revisions.xml" rel="self" type="application/atom+xml"/>
  <link href="${SITE}/papers/" rel="alternate" type="text/html"/>
  <id>${SITE}/revisions.xml</id>
  <updated>${iso(revs[0]?.date ?? new Date())}</updated>
  <author><name>Mosthofa Imran</name></author>
${revs.map((r) => `  <entry>
    <title>draft-imran-${r.slug}-${r.rev}: ${esc(r.title)}</title>
    <link href="${SITE}/papers/${r.slug}/#history" rel="alternate" type="text/html"/>
    <id>tag:mosthofaimran.com,${r.date.getUTCFullYear()}:revisions/${r.slug}/${r.rev}</id>
    <updated>${iso(r.date)}</updated>
    <summary type="text">${esc(r.note)}${r.conf != null ? ` Confidence after: ${r.conf}.` : ''}</summary>
  </entry>`).join('\n')}
</feed>
`
  return new Response(body, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } })
}

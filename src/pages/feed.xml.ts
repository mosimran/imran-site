import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
const SITE = 'https://mosthofaimran.com'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const iso = (d: Date) => d.toISOString().replace(/\.\d+Z$/, 'Z')

export const GET: APIRoute = async () => {
  const papers = await getCollection('papers')
  const impl = await getCollection('impl')
  const items = [
    ...papers.map((p) => ({
      // The id is keyed to the slug and MUST NOT carry the version suffix.
      // Put the suffix in and every revision spawns a duplicate entry.
      id: `tag:mosthofaimran.com,${p.data.revised.getUTCFullYear()}:papers/${p.slug}`,
      url: `${SITE}/papers/${p.slug}/`,
      title: `${p.data.section} ${p.data.title}`,
      updated: p.data.revised,
      summary: `${p.data.summary} State: ${p.data.state}. Confidence: ${p.data.confidence ?? 'n/a'}.`,
      cats: [p.data.state, `confidence:${p.data.confidence ?? 'n/a'}`],
    })),
    ...impl.map((n) => ({
      id: `tag:mosthofaimran.com,2026:impl/${n.slug}`,
      url: `${SITE}/impl/${n.slug}/`,
      title: `${n.data.section} ${n.data.title} (implementation note)`,
      updated: n.data.since ?? new Date('2026-01-01'),
      summary: n.data.summary,
      cats: [n.data.state],
    })),
  ].sort((a, b) => +b.updated - +a.updated)

  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Mosthofa Imran: Position Papers and Implementation Notes</title>
  <subtitle>Systems with numbers. Arguments with confidence values.</subtitle>
  <link href="${SITE}/feed.xml" rel="self" type="application/atom+xml"/>
  <link href="${SITE}/" rel="alternate" type="text/html"/>
  <id>${SITE}/</id>
  <updated>${iso(items[0]?.updated ?? new Date())}</updated>
  <author><name>Mosthofa Imran</name><email>imran@mosthofaimran.com</email></author>
  <rights>CC BY 4.0. Quote it, argue with it, carry the confidence value with it.</rights>
${items.map((i) => `  <entry>
    <title>${esc(i.title)}</title>
    <link href="${i.url}" rel="alternate" type="text/html"/>
    <id>${i.id}</id>
    <updated>${iso(i.updated)}</updated>
${i.cats.map((c) => `    <category term="${esc(String(c))}"/>`).join('\n')}
    <summary type="text">${esc(i.summary)}</summary>
  </entry>`).join('\n')}
</feed>
`
  return new Response(body, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } })
}

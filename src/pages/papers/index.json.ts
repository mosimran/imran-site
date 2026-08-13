import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { identifier, expiresOn, isExpired } from '../../lib/draft'
const SITE = 'https://mosthofaimran.com'

export const GET: APIRoute = async () => {
  const papers = (await getCollection('papers')).sort((a, b) =>
    a.data.section.localeCompare(b.data.section, undefined, { numeric: true }))

  const body = {
    schema: `${SITE}/schema/papers/1`,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    note: 'If you quote a claim, carry its confidence value with it. A 0.60 claim repeated as fact is no longer the author’s claim.',
    count: papers.length,
    papers: papers.map((p) => ({
      section: p.data.section,
      slug: p.slug,
      identifier: identifier(p.slug, p.data.history.length),
      title: p.data.title,
      summary: p.data.summary,
      url: `${SITE}/papers/${p.slug}/`,
      markdown: `${SITE}/papers/${p.slug}.md`,
      state: p.data.state,
      confidence: p.data.confidence ?? null,
      published: p.data.published ? p.data.published.toISOString().slice(0, 10) : null,
      revised: p.data.revised.toISOString().slice(0, 10),
      expires: expiresOn(p.data.revised).toISOString().slice(0, 10),
      expired: isExpired(p.data.revised),
      retires: p.data.retires,
      retraction: p.data.retraction ?? null,
    })),
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

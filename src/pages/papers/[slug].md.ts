import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { identifier, expiresOn } from '../../lib/draft'

// Canonical Markdown mirror. This is what a detached signature covers at T31,
// so it is the raw source with front matter restated, not a rendering of it.
export async function getStaticPaths() {
  const papers = await getCollection('papers')
  return papers.map((p) => ({ params: { slug: p.slug }, props: { p } }))
}

export const GET: APIRoute = async ({ props }) => {
  const { p } = props as any
  const d = p.data
  const iso = (x: Date) => x.toISOString().slice(0, 10)
  const fm = [
    '---',
    `identifier: ${identifier(p.slug, d.history.length)}`,
    `section: "${d.section}"`,
    `title: ${JSON.stringify(d.title)}`,
    `summary: ${JSON.stringify(d.summary)}`,
    `state: ${d.state}`,
    `confidence: ${d.confidence ?? 'null'}`,
    d.published ? `published: ${iso(d.published)}` : null,
    `revised: ${iso(d.revised)}`,
    `expires: ${iso(expiresOn(d.revised))}`,
    d.retires.length
      ? `retires:\n${d.retires.map((r: string) => `  - ${JSON.stringify(r)}`).join('\n')}`
      : 'retires: []',
    'license: https://creativecommons.org/licenses/by/4.0/',
    '---',
  ].filter(Boolean).join('\n')

  return new Response(`${fm}\n\n${p.body.trim()}\n`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}

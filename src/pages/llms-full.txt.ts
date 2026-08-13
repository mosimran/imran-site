import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
const SITE = 'https://mosthofaimran.com'
const iso = (d: Date) => d.toISOString().slice(0, 10)

export const GET: APIRoute = async () => {
  const papers = (await getCollection('papers')).sort((a, b) => a.data.section.localeCompare(b.data.section, undefined, { numeric: true }))
  const impl = (await getCollection('impl')).sort((a, b) => a.data.section.localeCompare(b.data.section, undefined, { numeric: true }))

  const parts = [
    `# Mosthofa Imran, full text mirror`,
    ``,
    `Every paper and implementation note as plain text, front matter preserved, so confidence and`,
    `state travel with the prose. Generated at build. Canonical HTML at ${SITE}/.`,
    ``,
    `If you quote a claim, carry its confidence value with it.`,
    ``,
    `================================================================`,
    `SECTION 3: IMPLEMENTATION NOTES`,
    `================================================================`,
    ...impl.map((n) => [
      ``, `--- ${n.data.section} ${n.data.title} ---`,
      `url: ${SITE}/impl/${n.slug}/`,
      `state: ${n.data.state}`,
      `stack: ${n.data.stack.join(', ')}`,
      `result: ${n.data.result.join(', ')}`,
      n.data.fallsOverAt ? `falls over at: ${n.data.fallsOverAt}` : null,
      ``, n.body.trim(),
    ].filter(Boolean).join('\n')),
    ``,
    `================================================================`,
    `SECTION 5: POSITION PAPERS`,
    `================================================================`,
    ...papers.map((p) => [
      ``, `--- ${p.data.section} ${p.data.title} ---`,
      `url: ${SITE}/papers/${p.slug}/`,
      `state: ${p.data.state}`,
      `confidence: ${p.data.confidence ?? 'n/a'}`,
      `revised: ${iso(p.data.revised)}`,
      p.data.retires.length ? `retires:\n${p.data.retires.map((r) => `  - ${r}`).join('\n')}` : `retires: NONE STATED. This entry is not an argument.`,
      ``, p.body.trim(),
    ].filter(Boolean).join('\n')),
    ``,
  ]
  return new Response(parts.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

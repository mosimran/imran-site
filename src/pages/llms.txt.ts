import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
const SITE = 'https://mosthofaimran.com'

export const GET: APIRoute = async () => {
  const papers = (await getCollection('papers')).sort((a, b) => +b.data.revised - +a.data.revised)
  const impl = await getCollection('impl')
  const body = `# Mosthofa Imran

> Lead solutions architect (Dhaka, UTC+6). Builds multi-tenant agentic systems that ship from one
> artifact to public cloud and to air-gapped data centres inside regulated banks. Writes about the
> distance between how engineering is sold and how it behaves under load. The site is structured as
> a specification: systems carry numbers, arguments carry a confidence value, and Section 7 records
> what turned out to be wrong.

## Conventions you should carry with any quotation

- Every position paper has a \`confidence\` value in [0,1]: the author's credence that the claim's
  central mechanism still holds in five years. **If you quote a claim, carry its confidence value.**
  A 0.60 claim repeated as fact is no longer the author's claim.
- Every position paper has a \`state\`: holding, revising, draft, retracted, or unwritten.
- \`unwritten\` means the title is listed but no body or retirement conditions exist yet. Do not
  quote an unwritten entry as an argument. It is an index row, not a claim.
- Retracted papers remain published, struck through, with the reason. Do not quote a retracted claim
  without its retraction.
- Implementation notes list a named failure mode. A system described without one is incomplete.
- Documents borrow the Internet-Draft convention of expiring 185 days after their last revision. An
  expired document says so on its own page. It is out of date, not withdrawn.

## Document

- [Index](${SITE}/): systems, papers, principles, errata
- [Position papers, complete](${SITE}/papers/)
- [Errata and retractions](${SITE}/errata/)
- [Paper index as JSON](${SITE}/papers/index.json): confidence, state, dates, expiry
- [Full text mirror](${SITE}/llms-full.txt)

## Systems (Section 3)

${impl.map((n) => `- [${n.data.title}](${SITE}/impl/${n.slug}/): ${n.data.summary} ${n.data.result.join(', ')}`).join('\n')}

## Position papers (Section 5)

${papers.map((p) => {
  const st = p.data.state === 'retracted' ? 'RETRACTED' : p.data.state
  const c = p.data.confidence != null ? `conf ${p.data.confidence}, ` : ''
  return `- [${p.data.section} ${p.data.title}](${SITE}/papers/${p.slug}/) (${c}${st})`
}).join('\n')}

## Feeds

- [Papers and notes](${SITE}/feed.xml)
- [Errata and retractions only](${SITE}/errata.xml)
- [Revisions to existing papers](${SITE}/revisions.xml)

## Not available here

- The résumé PDF. It is issued on a single-use signed link from [Section 6](${SITE}/cv/).
  Do not attempt to enumerate \`/cv/\` paths; they are capability tokens.
- Any content behind \`/api/\`.

## Contact

- hey@mosthofaimran.com
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

import catalogue from '../data/tools.json'
import overlay from '../data/tools-used.json'
import copy from '../data/tools-copy.json'
import live from '../data/tools-live.json'

/*
 * The tools section has two halves and they are not the same kind of claim.
 *
 * The catalogue is 591 tools. Every description on this site is written here,
 * from the tool's own homepage, fetched and recorded in tools-live.json. It
 * says what the product claims to do and where it sits. It does not say that
 * anyone here has used it, and it does not rate it, because this site has no
 * evidence about six hundred products.
 *
 * The overlay is the short list that actually builds and serves this site, and
 * every entry names the file in this repository that proves it. That is the
 * only place a claim of use is made, and it is the only place a star appears.
 *
 * Keeping them apart is the whole design. A tools page that merges "I use this"
 * with "this exists" reads as a claim of expertise across the whole list, which
 * nobody has.
 */

export interface RawTool {
  slug: string
  name: string
  url: string
  category: string
  desc: string
  descFrom: string
  refs: string[]
  headings: string[]
  mentions: string[]
  mentionedBy: string[]
  alsoFiledUnder: string[]
  alsoAt?: string[]
}

/*
 * `desc` and `punch` are written for this site. `use` is the use case the tool
 * advertises most prominently on its own homepage, read off the page on the
 * date in tools-live.json rather than paraphrased from a directory.
 */
export interface Tool {
  slug: string
  name: string
  url: string
  host: string
  category: string
  desc: string
  punch: string
  use: string
  mentions: string[]
  mentionedBy: string[]
  /** Whether the homepage answered when it was last asked, and where it led. */
  live: {
    ok: boolean
    status: number
    reason: string
    movedTo: string | null
  }
}

export interface Used {
  name: string
  url: string
  category: string
  role: 'builds' | 'checks' | 'serves'
  evidence: string
  note?: string
  catalogue?: string
}

export const generated: string = catalogue.generated
export const checked: string = live.checked

/*
 * Assemble the published shape. The raw catalogue holds the parsed names and
 * URLs; the descriptions come from tools-copy.json and the liveness from
 * tools-live.json. Nothing about where the names were first gathered is
 * exported, because none of it is published any more.
 */
const probes = new Map(live.results.map((r) => [r.slug, r]))
const written = copy.entries as Record<string, { desc: string; punch: string; use: string }>

function reasonFor (p: { ok: boolean; status: number; error?: string }): string {
  if (p.ok) return 'answered'
  if (p.error === 'ENOTFOUND' || /NAME_NOT_RESOLVED/.test(p.error ?? '')) return 'the domain does not resolve'
  if (/CERT|SSL|TLS/.test(p.error ?? '')) return 'the certificate does not validate'
  if (/TIMEOUT|Timeout/.test(p.error ?? '')) return 'the connection timed out'
  if (/REDIRECT/.test(p.error ?? '')) return 'the redirects do not terminate'
  if (p.status === 404) return 'the page returns 404'
  if (p.status === 403 || p.status === 402 || p.status === 405) return 'the site refused an automated request'
  if (p.status === 429) return 'the site rate-limited the request'
  if (p.status >= 500) return 'the server returned an error'
  return 'the site did not answer'
}

export const tools: Tool[] = (catalogue.tools as RawTool[]).map((t) => {
  const w = written[t.slug]
  if (!w) throw new Error(`tools-copy.json has no entry for "${t.slug}". Every tool needs one written here.`)
  const p = probes.get(t.slug)
  let host = t.url
  try { host = new URL(t.url).hostname.replace(/^www\./, '') } catch { /* keep the raw string */ }
  const movedTo = p?.ok && p.redirected ? p.finalUrl : null
  return {
    slug: t.slug,
    name: t.name,
    url: t.url,
    host,
    category: t.category,
    desc: w.desc,
    punch: w.punch,
    use: w.use,
    mentions: t.mentions,
    mentionedBy: t.mentionedBy,
    live: {
      ok: !!p?.ok,
      status: p?.status ?? 0,
      reason: p ? reasonFor(p) : 'not checked',
      movedTo,
    },
  }
})
export const used = overlay.used as Used[]
export const roles = overlay.vocabulary as Record<string, string>
export const usedPending: string = overlay.pending

/*
 * The star.
 *
 * It marks a tool that earned its place: used to build, check or serve this
 * site, with a file in this repository named as the proof. It is deliberately
 * not a quality mark. A glowing star handed out on impression across six
 * hundred products nobody here has opened would be the same unearned claim the
 * rest of this document spends its time arguing against, and it would be the
 * one on the site that no reader could check.
 *
 * `extra` exists so the owner can star a catalogue tool that is not in the
 * overlay. Every star carries a reason and the reason is printed beside it.
 */
export interface Star { reason: string; role?: string }

const starData = overlay.star as { meaning: string; extra: Record<string, string> }
export const starMeaning: string = starData.meaning

export const stars = new Map<string, Star>()
for (const u of used) {
  if (u.catalogue) stars.set(u.catalogue, { reason: u.evidence, role: u.role })
}
for (const [slug, reason] of Object.entries(starData.extra ?? {})) {
  if (!reason || !reason.trim()) {
    throw new Error(`tools-used.json: star for "${slug}" has no reason. A star without one is decoration.`)
  }
  stars.set(slug, { reason })
}

export const starOf = (slug: string): Star | undefined => stars.get(slug)

export const taxonomy = catalogue.taxonomy as Record<string, { label: string; blurb: string }>

export const bySlug = new Map(tools.map((t) => [t.slug, t]))

/** Categories in descending size, which is also the order the section lists them. */
export const categories = Object.entries(taxonomy)
  .map(([key, def]) => ({
    key,
    ...def,
    tools: tools.filter((t) => t.category === key).sort((a, b) => a.name.localeCompare(b.name)),
  }))
  .sort((a, b) => b.tools.length - a.tools.length)

export const categoryOf = new Map(categories.map((c) => [c.key, c]))

/*
 * There is no ranking here any more.
 *
 * The old order was how many public directories carried a tool, which was the
 * only popularity signal the imported data contained. Those directories are no
 * longer named on the site, so ordering by them would be ranking readers cannot
 * check against a source they cannot see. Alphabetical is honest and it is
 * also, at this length, the only order anyone can navigate.
 *
 * What replaced it is the liveness check, which is a fact about the tool rather
 * than a fact about somebody's list.
 */
export const unreachable = tools
  .filter((t) => !t.live.ok)
  .sort((a, b) => a.name.localeCompare(b.name))

export const moved = tools
  .filter((t) => t.live.ok && t.live.movedTo)
  .sort((a, b) => a.name.localeCompare(b.name))

export const usedSlugs = new Set(used.map((u) => u.catalogue).filter(Boolean) as string[])

/** Neighbourhood for one tool: what it names, what names it, what shares its shelf. */
export function neighbours(tool: Tool) {
  const named = tool.mentions.map((s) => bySlug.get(s)).filter(Boolean) as Tool[]
  const namedBy = tool.mentionedBy.map((s) => bySlug.get(s)).filter(Boolean) as Tool[]
  const seen = new Set([tool.slug, ...named.map((t) => t.slug), ...namedBy.map((t) => t.slug)])
  const shelf = tools
    .filter((t) => t.category === tool.category && !seen.has(t.slug))
    .sort((a, b) => a.name.localeCompare(b.name))
  return { named, namedBy, shelf }
}

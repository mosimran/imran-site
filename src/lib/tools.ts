import catalogue from '../data/tools.json'
import overlay from '../data/tools-used.json'

/*
 * The tools section has two halves and they are not the same kind of claim.
 *
 * The catalogue is 591 tools parsed out of three public awesome-lists at a
 * pinned commit. Every row is quoted, attributed and dated. It says what those
 * lists say and nothing else. In particular it does not say that anyone here
 * has ever opened any of them.
 *
 * The overlay is the short list that is actually used to build and serve this
 * site, and every entry names the file in this repository that proves it. It is
 * short because the evidence is what makes an entry admissible, not the wish to
 * have a long list.
 *
 * Keeping them apart is the whole design. A tools page that merges "I use this"
 * with "someone on GitHub listed this" is the CV appendix problem: it reads as a
 * claim of expertise across six hundred products, which nobody has.
 */

export interface Tool {
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

export interface Source {
  id: string
  title: string
  repo: string
  url: string
  commit: string
  commitShort: string
  commitDate: string
  licence: string
  licenceUrl: string
  entries: number
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
export const sources = catalogue.sources as Source[]
export const tools = catalogue.tools as Tool[]
export const used = overlay.used as Used[]
export const roles = overlay.vocabulary as Record<string, string>
export const usedPending: string = overlay.pending

export const taxonomy = catalogue.taxonomy as Record<string, { label: string; blurb: string }>

export const bySlug = new Map(tools.map((t) => [t.slug, t]))
export const sourceById = new Map(sources.map((s) => [s.id, s]))

/** Categories in descending size, which is also the order the section lists them. */
export const categories = Object.entries(taxonomy)
  .map(([key, def]) => ({
    key,
    ...def,
    tools: tools.filter((t) => t.category === key),
  }))
  .sort((a, b) => b.tools.length - a.tools.length)

export const categoryOf = new Map(categories.map((c) => [c.key, c]))

/*
 * The only popularity signal these lists contain is whether more than one of
 * them bothered to include a tool. It is weak, and it is real, which is more
 * than can be said for a star count copied off a badge or a depth rating nobody
 * measured. It is labelled as what it is everywhere it appears.
 */
export const crossReferenced = tools
  .filter((t) => t.refs.length > 1)
  .sort((a, b) => b.refs.length - a.refs.length || a.name.localeCompare(b.name))

export const usedSlugs = new Set(used.map((u) => u.catalogue).filter(Boolean) as string[])

/** Neighbourhood for one tool: what it names, what names it, what shares its shelf. */
export function neighbours(tool: Tool) {
  const named = tool.mentions.map((s) => bySlug.get(s)).filter(Boolean) as Tool[]
  const namedBy = tool.mentionedBy.map((s) => bySlug.get(s)).filter(Boolean) as Tool[]
  const seen = new Set([tool.slug, ...named.map((t) => t.slug), ...namedBy.map((t) => t.slug)])
  const shelf = tools
    .filter((t) => t.category === tool.category && !seen.has(t.slug))
    .sort((a, b) => b.refs.length - a.refs.length || a.name.localeCompare(b.name))
  return { named, namedBy, shelf }
}

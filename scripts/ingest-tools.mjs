/*
 * Ingests three public awesome-lists into src/data/tools.json.
 *
 * This runs by hand, not at build time, and its output is committed. A build
 * that reaches the network is a build whose result depends on a stranger's
 * uptime, and the whole point of the catalogue is that every row can be traced
 * to a fixed source at a fixed commit.
 *
 * What it records is what the sources actually say. It does not record how
 * heavily any of these tools is used here: no list on GitHub knows that, and
 * inventing it is exactly the failure this site exists to argue against. The
 * usage overlay lives in src/data/tools-used.json and is written by hand from
 * evidence.
 *
 * Usage: node scripts/ingest-tools.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs'

const SOURCES = [
  {
    id: 'devtools',
    repo: 'devtoolsd/awesome-devtools',
    file: 'readme.md',
    title: 'Awesome DevTools',
    licence: 'Unlicense',
    licenceUrl: 'https://unlicense.org/',
  },
  {
    id: 'ai-coding',
    repo: 'ai-for-developers/awesome-ai-coding-tools',
    file: 'README.md',
    title: 'Awesome AI Coding Tools',
    licence: 'MIT',
    licenceUrl: 'https://opensource.org/licenses/MIT',
  },
  {
    id: 'developer-first',
    repo: 'agamm/awesome-developer-first',
    file: 'README.md',
    title: 'Awesome Developer-First',
    licence: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
]

/*
 * Sixty-eight headings across three lists, collapsed to fourteen. The mapping is
 * explicit rather than clever because the alternative is a keyword heuristic
 * that silently reclassifies a tool when someone upstream renames a heading.
 * Anything unmapped lands in `other` and the script says so loudly.
 */
const TAXONOMY = {
  'ai-assistants': {
    label: 'AI assistants and agents',
    blurb: 'Editors, completions and agents that write or change code.',
    from: ['AI Coding Tools', 'AI Coding', 'Code Editors and Assistants', 'Code Completion',
      'Coding Agents', 'App Builders', 'UI Generators', 'Gen UI'],
  },
  'ai-models': {
    label: 'Models and AI infrastructure',
    blurb: 'Model families, local runners, SDKs and the MCP surface.',
    from: ['Code Models', 'AI Frameworks and SDKs', 'Local LLM Tools',
      'MCP Servers and Directories', 'Natural Language Processing', 'Computer Vision'],
  },
  editors: {
    label: 'Editors and IDEs',
    blurb: 'Where the code is actually typed.',
    from: ['IDEs & Code Editors', 'IDE'],
  },
  terminal: {
    label: 'Terminal and CLI',
    blurb: 'Shells, terminal emulators and command-line utilities.',
    from: ['CLIs & Terminal Tools', 'CLI Tools'],
  },
  hosting: {
    label: 'Hosting and cloud',
    blurb: 'Where it runs once it leaves the laptop.',
    from: ['Cloud Platforms', 'Deployment Hosting'],
  },
  devops: {
    label: 'CI, CD and infrastructure',
    blurb: 'Pipelines, provisioning and orchestration.',
    from: ['DevOps & Infrastructure', 'DevOps and Infrastructure', 'CI/CD',
      'Infrastructure as Code', 'Orchestration', 'Automation'],
  },
  data: {
    label: 'Data, APIs and backends',
    blurb: 'Databases, backends-as-a-service, API tooling and search.',
    from: ['APIs & Backends', 'Backend-as-a-Service', 'Databases & Spreadsheets',
      'Database Migration & DevOps', 'Database and API Tools', 'Search'],
  },
  testing: {
    label: 'Testing and code quality',
    blurb: 'Test runners, review tools, linters and debuggers.',
    from: ['Testing & Quality', 'Testing and QA', 'Testing', 'Code Quality',
      'Code Review and Refactoring', 'Debugging'],
  },
  observability: {
    label: 'Monitoring and analytics',
    blurb: 'Knowing what the thing did after you shipped it.',
    from: ['Monitoring', 'Analytics', 'Analytics Tools', 'Reports Generation'],
  },
  security: {
    label: 'Security and secrets',
    blurb: 'Scanning, identity and secret handling.',
    from: ['Security', 'Authentication & Identity', 'Environment & Secret Management'],
  },
  docs: {
    label: 'Docs and content',
    blurb: 'Documentation platforms, headless CMS and localisation.',
    from: ['Docs & Knowledge', 'Documentation', 'CMS (headless)', 'Localization'],
  },
  design: {
    label: 'Design and media',
    blurb: 'Interface design, images and video.',
    from: ['Design & UI Tools', 'Media'],
  },
  workflow: {
    label: 'Workflow and productivity',
    blurb: 'Repos, code navigation, extensions and the rest of the desk.',
    from: ['Productivity & Misc', 'Developer Productivity Tools', 'Browser Extensions',
      'Misc', 'Discussions', 'Repo', 'Code Search and Navigation', 'Integrations',
      'Feature Flags', 'Scraping', 'GEO'],
  },
  commerce: {
    label: 'Payments and messaging',
    blurb: 'Billing, mail, messaging and shipping.',
    from: ['Payments & Pricing', 'Shipping', 'Mail', 'Messaging'],
  },
}

const CATEGORY_OF = new Map()
for (const [key, def] of Object.entries(TAXONOMY)) {
  for (const heading of def.from) CATEGORY_OF.set(heading.toLowerCase(), key)
}

const SKIP_HEADINGS = /^(contents|table of contents|contributing|licen[cs]e|related|contributors|acknowledg)/i
const BULLET = /^\s*[-*]\s+(.*)$/
const LINK = /\[([^\]]+)\]\(([^)]+)\)/

function stripBadges (s) {
  let prev
  do { prev = s; s = s.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '') } while (s !== prev)
  return s.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
}

// Two rows pointing at the same product are one tool. Host plus path, lowercased,
// without the trailing slash or the `www.`, is enough to catch the overlap and
// does not merge two different products that happen to share a host.
function canonical (url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '').toLowerCase() + u.pathname.replace(/\/+$/, '')
  } catch { return null }
}

function slugify (name, key) {
  const s = name.toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return s || key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function head (repo) {
  const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, {
    headers: { 'user-agent': 'imran-site-ingest', accept: 'application/vnd.github+json' },
  })
  if (!r.ok) throw new Error(`${repo}: commits ${r.status}`)
  const [c] = await r.json()
  return { sha: c.sha, date: c.commit.committer.date.slice(0, 10) }
}

const rows = []
const manifest = []
const unmapped = new Map()

for (const src of SOURCES) {
  const { sha, date } = await head(src.repo)
  const r = await fetch(`https://raw.githubusercontent.com/${src.repo}/${sha}/${src.file}`)
  if (!r.ok) throw new Error(`${src.repo}: readme ${r.status}`)
  const text = await r.text()

  let heading = null, skipping = false, fenced = false, count = 0
  for (const raw of text.split('\n')) {
    if (/^```/.test(raw)) { fenced = !fenced; continue }
    if (fenced) continue

    const h = raw.match(/^(#{2,3})\s+(.+?)\s*$/)
    if (h) {
      const label = h[2].replace(/\[|\]|\(#[^)]*\)/g, '').trim()
      skipping = SKIP_HEADINGS.test(label)
      heading = skipping ? null : label
      continue
    }
    if (skipping || !heading) continue

    const b = raw.match(BULLET)
    if (!b) continue
    const body = stripBadges(b[1]).trim()
    const m = body.match(LINK)
    if (!m) continue

    const [full, name, url] = m
    if (!/^https?:/i.test(url)) continue
    const key = canonical(url)
    if (!key) continue

    const category = CATEGORY_OF.get(heading.toLowerCase()) || 'other'
    if (category === 'other') {
      unmapped.set(heading, (unmapped.get(heading) || 0) + 1)
    }

    const desc = stripBadges(body.slice(body.indexOf(full) + full.length))
      .replace(/^\s*[-–—:]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim()

    rows.push({ source: src.id, heading, category, name: name.trim(), url, key, desc })
    count++
  }

  manifest.push({
    id: src.id,
    title: src.title,
    repo: src.repo,
    url: `https://github.com/${src.repo}`,
    commit: sha,
    commitShort: sha.slice(0, 7),
    commitDate: date,
    licence: src.licence,
    licenceUrl: src.licenceUrl,
    entries: count,
  })
  console.log(`  ${src.id.padEnd(16)} ${String(count).padStart(4)} entries  @ ${sha.slice(0, 7)} (${date})`)
}

// Merge duplicates. The longest description wins because the short one is
// usually a stub, and the source that supplied it is recorded so the quote can
// be attributed to the list it came from rather than to the site.
const merged = new Map()
for (const row of rows) {
  const existing = merged.get(row.key)
  if (!existing) {
    merged.set(row.key, {
      slug: slugify(row.name, row.key),
      name: row.name,
      url: row.url,
      key: row.key,
      category: row.category,
      categories: [row.category],
      headings: [row.heading],
      refs: [row.source],
      desc: row.desc,
      descFrom: row.source,
    })
    continue
  }
  if (!existing.refs.includes(row.source)) existing.refs.push(row.source)
  if (!existing.headings.includes(row.heading)) existing.headings.push(row.heading)
  if (!existing.categories.includes(row.category)) existing.categories.push(row.category)
  if (row.desc.length > existing.desc.length) {
    existing.desc = row.desc
    existing.descFrom = row.source
  }
  // A tool filed under a real category by one list and `other` by another keeps
  // the real one.
  if (existing.category === 'other' && row.category !== 'other') existing.category = row.category
}

const tools = [...merged.values()]

/*
 * A second pass, by name. Ten products are listed under two or three different
 * URLs across these lists: cursor.so, cursor.sh and cursor.com are one editor,
 * and a docs page and a marketing page are one Claude Code. Host-and-path alone
 * reported them as separate tools and undercounted every cross-list reference.
 *
 * Merging on an exact normalised name is narrow enough to be safe here and every
 * merge is printed, because a silent merge of two genuinely different products
 * that happen to share a name is the failure mode this trades for.
 */
const byNorm = new Map()
const nameMerges = []
for (const t of tools) {
  const norm = t.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const first = byNorm.get(norm)
  if (!first) { byNorm.set(norm, t); continue }
  for (const r of t.refs) if (!first.refs.includes(r)) first.refs.push(r)
  for (const h of t.headings) if (!first.headings.includes(h)) first.headings.push(h)
  for (const c of t.categories) if (!first.categories.includes(c)) first.categories.push(c)
  if (t.desc.length > first.desc.length) { first.desc = t.desc; first.descFrom = t.descFrom }
  if (first.category === 'other' && t.category !== 'other') first.category = t.category
  if (!first.alsoAt) first.alsoAt = []
  first.alsoAt.push(t.url)
  nameMerges.push(`${first.name}: ${first.url} + ${t.url}`)
  t.merged = true
}
const kept = tools.filter((t) => !t.merged)
tools.length = 0
tools.push(...kept)

// Slugs are URLs and URLs never change, so a collision has to be resolved here
// rather than discovered in production.
const seen = new Map()
for (const t of tools) {
  const base = t.slug
  let n = 1
  while (seen.has(t.slug)) t.slug = `${base}-${++n}`
  seen.set(t.slug, t)
}

/*
 * Integrations. An edge exists when one tool's description names another tool
 * in the catalogue. That is a weak signal and it is the only one present in the
 * data, so it is labelled for what it is rather than dressed up as a knowledge
 * graph. Short and ambiguous names are excluded: "Fine", "Continue" and "Repo"
 * match ordinary English and would wire the whole catalogue together.
 */
const AMBIGUOUS = new Set(['fine', 'continue', 'repo', 'mail', 'search', 'render',
  'linear', 'warp', 'stack', 'craft', 'motion', 'val town', 'pipe', 'orbit', 'raw',
  'basic', 'zed', 'arc', 'bolt', 'v0', 'lite', 'cursor'])

const byName = tools
  .filter((t) => t.name.length >= 4 && !AMBIGUOUS.has(t.name.toLowerCase()))
  .map((t) => ({ t, re: new RegExp(`\\b${t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i') }))

for (const t of tools) t.mentions = []
for (const t of tools) {
  for (const { t: other, re } of byName) {
    if (other.key === t.key) continue
    if (re.test(t.desc)) t.mentions.push(other.slug)
  }
}
// Reciprocal edge, so a tool's page can show what points at it too.
const mentionedBy = new Map()
for (const t of tools) {
  for (const s of t.mentions) {
    if (!mentionedBy.has(s)) mentionedBy.set(s, [])
    mentionedBy.get(s).push(t.slug)
  }
}
for (const t of tools) t.mentionedBy = mentionedBy.get(t.slug) || []

tools.sort((a, b) => b.refs.length - a.refs.length || a.name.localeCompare(b.name))

const payload = {
  generated: new Date().toISOString().slice(0, 10),
  note: 'Generated by scripts/ingest-tools.mjs. Edit the script, not this file.',
  taxonomy: Object.fromEntries(
    Object.entries(TAXONOMY).map(([k, v]) => [k, { label: v.label, blurb: v.blurb }]),
  ),
  sources: manifest,
  tools: tools.map(({ key, categories, ...rest }) => ({ ...rest, alsoFiledUnder: categories.filter((c) => c !== rest.category) })),
}

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/tools.json', JSON.stringify(payload, null, 1) + '\n')

const counts = {}
for (const t of tools) counts[t.category] = (counts[t.category] || 0) + 1
console.log(`\n  ${rows.length} rows, ${tools.length} tools after merge`)
console.log(`  ${tools.filter((t) => t.refs.length > 1).length} appear in more than one list`)
console.log(`  ${tools.reduce((n, t) => n + t.mentions.length, 0)} integration edges\n`)
if (nameMerges.length) {
  console.log(`  ${nameMerges.length} merged on name:`)
  for (const m of nameMerges) console.log(`    ${m}`)
}
console.log()
for (const [k, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(16)} ${String(n).padStart(4)}`)
}
if (unmapped.size) {
  console.log('\n  UNMAPPED HEADINGS (add them to TAXONOMY):')
  for (const [h, n] of [...unmapped].sort((a, b) => b[1] - a[1])) console.log(`    ${h} (${n})`)
  process.exit(1)
}

import catalogue from '../../src/data/tools.json'

/*
 * GET /tools/search?q=...
 *
 * The reading path ships zero bytes of JavaScript, so a client-side search index
 * is not available here and never will be. This is a plain GET from a plain
 * form, answered on the server and rendered as HTML. No script runs in the
 * browser, which is the same property the rest of the site has, reached by the
 * only route left open.
 *
 * The catalogue is bundled into the worker at deploy time rather than fetched,
 * so a search does not depend on the static site being reachable from inside
 * the function.
 */

interface Tool {
  slug: string
  name: string
  url: string
  category: string
  desc: string
  refs: string[]
  mentions: string[]
  mentionedBy: string[]
}

const TOOLS = catalogue.tools as Tool[]
const TAXONOMY = catalogue.taxonomy as Record<string, { label: string; blurb: string }>

const MAX_Q = 64
const MAX_HITS = 60

/*
 * The query is reflected into the response, so it is escaped on the way out.
 * Ampersand first, or the escapes introduced below get escaped again.
 */
function esc (s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function hasPage (t: Tool): boolean {
  return t.refs.length > 1 || t.mentions.length > 0 || t.mentionedBy.length > 0
}

/*
 * Name matches outrank description matches, and a prefix outranks a match in
 * the middle of a word. Nothing cleverer: a stemmer or a fuzzy distance would
 * make the ranking harder to explain than the result is worth.
 */
function rank (t: Tool, q: string): number {
  const name = t.name.toLowerCase()
  const desc = t.desc.toLowerCase()
  if (name === q) return 100
  if (name.startsWith(q)) return 80
  if (name.includes(q)) return 60
  if (desc.includes(` ${q}`)) return 30
  if (desc.includes(q)) return 20
  if ((TAXONOMY[t.category]?.label ?? '').toLowerCase().includes(q)) return 10
  return 0
}

const STYLE = `
:root{--paper:#fdfdfb;--sheet:#f5f5f1;--ink:#14171a;--dim:#586470;--rule:#e3e7eb;
--accent:#0a6a67;--link:#123c8a;
--mono:ui-monospace,"SF Mono","JetBrains Mono","IBM Plex Mono",Menlo,Consolas,monospace;
--text:"Charter","Iowan Old Style","Source Serif 4",ui-serif,Georgia,serif}
@media(prefers-color-scheme:dark){:root{--paper:#0d1013;--sheet:#141a1f;--ink:#dde2e6;
--dim:#8d97a1;--rule:#222a31;--accent:#4fbdb6;--link:#8fb4ee}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--mono);
font-size:14px;line-height:1.7}
.p{max-width:760px;margin:0 auto;padding:34px 20px 90px}
a{color:var(--link);text-decoration:none;border-bottom:1px solid var(--rule)}
a:hover{border-bottom-color:currentColor}
.ep{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700}
h1{font-size:17px;letter-spacing:.02em;text-transform:uppercase;margin:12px 0 18px;
padding-bottom:12px;border-bottom:1px solid var(--rule)}
p{font-family:var(--text);font-size:16px;line-height:1.55;max-width:62ch;margin:0 0 14px}
.d{color:var(--dim)}
form{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 22px}
input{flex:1 1 12em;min-width:0;font-family:var(--mono);font-size:15px;padding:11px 12px;
color:var(--ink);background:var(--paper);border:1px solid var(--rule);border-radius:2px}
input:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
button{font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;
padding:11px 18px;min-height:44px;cursor:pointer;color:var(--paper);background:var(--accent);
border:1px solid var(--accent);border-radius:2px}
ul{list-style:none;margin:16px 0;padding:0;border-top:1px solid var(--rule)}
li{padding:11px 0 12px;border-bottom:1px solid var(--rule)}
.h{display:flex;gap:9px;align-items:baseline;flex-wrap:wrap}
.h a,.h b{font-family:var(--mono);font-size:14.5px;font-weight:600;word-break:break-word}
.s{font-family:var(--text);font-size:15px;line-height:1.5;color:var(--dim);margin-top:3px}
.m{font-size:11.5px;color:var(--dim);margin-top:6px}
.r{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;
border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);color:var(--accent);
padding:1px 6px;border-radius:2px}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media(max-width:520px){button{flex:1 1 100%}}
`

function page (q: string, body: string, title: string): Response {
  const safe = esc(q)
  return new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body><!--email_off--><div class="p">
<div class="ep">Tools</div>
<h1>${esc(title)}</h1>
<form method="get" action="/tools/search">
<label class="vh" for="q">Search the catalogue</label>
<input id="q" name="q" type="search" value="${safe}" placeholder="postgres, terminal, code review" autocomplete="off" required>
<button type="submit">Search</button>
</form>
${body}
<p class="d"><a href="/tools/">Back to the catalogue</a> &middot; <a href="/">Index</a></p>
</div><!--/email_off--></body>
</html>`, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex',
      'cache-control': 'public, max-age=300',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
    },
  })
}

export const onRequestGet: PagesFunction = async (ctx) => {
  const raw = (new URL(ctx.request.url).searchParams.get('q') ?? '').trim().slice(0, MAX_Q)
  const q = raw.toLowerCase()

  if (!q) {
    return page('', '<p>Type a name, a category or a word from a description. The catalogue holds '
      + `${TOOLS.length} tools quoted from three public lists.</p>`
      + '<p class="d">This searches the catalogue only. The short list of tools that are actually '
      + 'used to build this site, each with the file that proves it, is on the '
      + '<a href="/tools/#used">catalogue front page</a>.</p>', 'Search the catalogue')
  }

  const hits = TOOLS
    .map((t) => ({ t, score: rank(t, q) }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score || b.t.refs.length - a.t.refs.length || a.t.name.localeCompare(b.t.name))

  const shown = hits.slice(0, MAX_HITS)
  const title = `${hits.length} result${hits.length === 1 ? '' : 's'} for "${raw}"`

  if (!hits.length) {
    return page(raw, `<p>Nothing in the catalogue matches <b>${esc(raw)}</b>.</p>`
      + '<p class="d">The catalogue is three lists of developer products. It contains no '
      + 'programming languages, no runtimes and no operating system tools, because none of the '
      + 'three sources lists those. If that is what you were looking for, it is not missing by '
      + 'accident and it is not here.</p>'
      + '<p><a href="/tools/#categories">Browse by category</a> instead.</p>', 'No results')
  }

  const body = '<ul>' + shown.map((h) => {
    const t = h.t
    const href = hasPage(t) ? `/tools/${t.slug}/` : t.url
    const label = TAXONOMY[t.category]?.label ?? t.category
    return `<li><div class="h"><a href="${esc(href)}"${hasPage(t) ? '' : ' rel="noopener"'}>${esc(t.name)}</a>`
      + (t.refs.length > 1 ? `<span class="r">${t.refs.length} of 3 lists</span>` : '')
      + `</div><div class="s">${esc(t.desc)}</div>`
      + `<div class="m"><a href="/tools/in/${esc(t.category)}/">${esc(label)}</a></div></li>`
  }).join('') + '</ul>'

  const more = hits.length > MAX_HITS
    ? `<p class="d">Showing the first ${MAX_HITS} of ${hits.length}. Narrow the query or `
      + '<a href="/tools/#categories">browse by category</a>.</p>'
    : ''

  return page(raw, body + more, title)
}

// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { readdirSync, readFileSync } from 'node:fs'

// lastmod must come from each paper's `revised` field, never the file mtime.
// A reformat changes the mtime and changes nothing a reader would care about;
// claiming it as a revision on a site about honest revision would be poor.
function revisedDates() {
  const map = {}
  for (const [dir, prefix, field] of [['papers', 'papers', 'revised'], ['impl', 'impl', 'since']]) {
    let files = []
    try { files = readdirSync(`src/content/${dir}`).filter((f) => f.endsWith('.md')) } catch {}
    for (const f of files) {
      const body = readFileSync(`src/content/${dir}/${f}`, 'utf8')
      const m = body.match(new RegExp(`^${field}:\\s*([0-9]{4}-[0-9]{2}-[0-9]{2})`, 'm'))
      if (m) map[`/${prefix}/${f.replace(/\.md$/, '')}/`] = m[1]
    }
  }
  return map
}
const LASTMOD = revisedDates()

// The canonical origin. johnefemer.com and imran.com.bd serve the same bytes and
// point their canonical here, so this value is what makes aliasing safe.
// See docs/PLAN.md section 2.1.
export default defineConfig({
  site: 'https://mosthofaimran.com',
  integrations: [
    sitemap({
      // lastmod comes from each paper's `revised` date, not the file mtime, so a
      // reformat cannot claim a revision. Set per page via the serialize hook.
      filter: (page) => !page.includes('/cv/') && !page.includes('/404'),
      serialize(item) {
        const path = new URL(item.url).pathname
        if (LASTMOD[path]) item.lastmod = LASTMOD[path]
        return item
      },
    }),
  ],
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // One stylesheet, inlined. BUILD.md section 6 budgets it under 12 KB and
    // forbids a second request in the reading path.
    inlineStylesheets: 'always',
  },
  // Nothing in the reading path ships JavaScript. If a build ever emits a
  // bundle, check-budget.mjs (T19) fails it.
})

// @ts-check
import { defineConfig } from 'astro/config'

// The canonical origin. johnefemer.com and imran.com.bd serve the same bytes and
// point their canonical here, so this value is what makes aliasing safe.
// See docs/PLAN.md section 2.1.
export default defineConfig({
  site: 'https://mosthofaimran.com',
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

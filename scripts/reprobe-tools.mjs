/*
 * Second pass, in a real browser.
 *
 * 22 of the 52 failures in scripts/fetch-tools.mjs were 403 or 429: bot
 * detection and rate limits, not dead sites. Recording those as dead would put
 * a false claim on the page, and writing their descriptions from memory instead
 * would be worse, because memory is exactly the unverifiable source this
 * catalogue is meant to avoid.
 *
 * So the ones that refused a plain fetch get asked again by Chromium, one at a
 * time, slowly. Whatever still refuses is recorded as refusing rather than as
 * gone.
 *
 * Usage: node scripts/reprobe-tools.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const live = JSON.parse(readFileSync('src/data/tools-live.json', 'utf8'))
const retry = live.results.filter((r) => !r.ok)
console.log(`\n  re-probing ${retry.length} that a plain fetch could not read\n`)

const browser = await chromium.launch()
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 900 },
})
let recovered = 0

for (const r of retry) {
  const page = await ctx.newPage()
  try {
    const resp = await page.goto(r.finalUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 })
    const status = resp?.status() ?? 0
    if (status >= 200 && status < 400) {
      const got = await page.evaluate(() => {
        const m = (n) => document.querySelector(
          `meta[name="${n}"],meta[property="${n}"]`)?.getAttribute('content')?.trim() || ''
        return {
          title: document.title || '',
          description: m('description') || m('og:description') || m('twitter:description'),
          ogTitle: m('og:title') || m('twitter:title'),
          h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 200) || '',
        }
      })
      const url = page.url()
      Object.assign(r, {
        status, ok: true, finalUrl: url,
        redirected: url.replace(/\/$/, '') !== r.finalUrl.replace(/\/$/, ''),
        ...got,
        recoveredInBrowser: true,
      })
      delete r.error
      recovered++
      console.log(`  ok   ${r.slug.padEnd(26)} ${status}  ${(got.description || got.h1 || got.title).slice(0, 58)}`)
    } else {
      r.status = status
      r.browserStatus = status
      console.log(`  --   ${r.slug.padEnd(26)} ${status}`)
    }
  } catch (e) {
    r.browserError = String(e.message).split('\n')[0].slice(0, 70)
    console.log(`  --   ${r.slug.padEnd(26)} ${r.browserError.slice(0, 40)}`)
  } finally {
    await page.close()
    await new Promise((s) => setTimeout(s, 900))
  }
}

await browser.close()
live.results.sort((a, b) => a.slug.localeCompare(b.slug))
writeFileSync('src/data/tools-live.json', JSON.stringify(live, null, 1) + '\n')

const stillDead = live.results.filter((r) => !r.ok)
console.log(`\n  ${recovered} recovered in a browser`)
console.log(`  ${stillDead.length} still unreachable\n`)
